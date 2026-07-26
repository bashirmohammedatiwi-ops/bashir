#!/usr/bin/env bash
# Shared helpers for deploy.sh, update.sh, and verify.sh
# shellcheck shell=bash

# Expect INFRA_ROOT (or ROOT) and COMPOSE to be set before sourcing.

_infra_root() {
  if [[ -n "${INFRA_ROOT:-}" ]]; then
    echo "$INFRA_ROOT"
  elif [[ -n "${ROOT:-}" ]]; then
    echo "$ROOT"
  else
    echo "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
  fi
}

ssl_cert_exists() {
  local domain="${DOMAIN:-}"
  [[ -z "$domain" ]] && return 1
  $COMPOSE exec -T nginx test -f "/etc/letsencrypt/live/${domain}/fullchain.pem" 2>/dev/null
}

server_primary_ip() {
  hostname -I 2>/dev/null | awk '{print $1}' || true
}

set_env_var() {
  local key="$1"
  local value="$2"
  local file="$(_infra_root)/.env"

  if grep -q "^${key}=" "$file" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    echo "${key}=${value}" >>"$file"
  fi
}

ensure_env_production_defaults() {
  local domain="${DOMAIN:-}"
  local file="$(_infra_root)/.env"
  local changed=0
  local cors ip

  [[ -f "$file" ]] || return 0
  [[ -z "$domain" || "$domain" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] && return 0

  cors="http://${domain},https://${domain}"
  ip="$(server_primary_ip)"
  if [[ -n "$ip" ]]; then
    cors="${cors},http://${ip}"
  fi

  if ! grep -q '^CORS_ORIGIN=' "$file" 2>/dev/null; then
    echo "CORS_ORIGIN=${cors}" >>"$file"
    changed=1
  elif ! grep '^CORS_ORIGIN=' "$file" | grep -qF "http://${domain}"; then
    set_env_var CORS_ORIGIN "$cors"
    changed=1
  fi

  if ! grep -q '^MEDIA_PUBLIC_BASE_URL=' "$file" 2>/dev/null; then
    echo "MEDIA_PUBLIC_BASE_URL=https://${domain}/media" >>"$file"
    changed=1
  fi

  if ! grep -q '^ENABLE_HSTS=' "$file" 2>/dev/null; then
    echo "ENABLE_HSTS=0" >>"$file"
    changed=1
  fi

  if [[ "$changed" -eq 1 ]]; then
    echo "==> Applied production defaults to .env"
    set -a
    # shellcheck disable=SC1091
    source "$file"
    set +a
  fi
}

sync_hsts_with_ssl() {
  local file="$(_infra_root)/.env"
  [[ -f "$file" ]] || return 0

  if ssl_cert_exists; then
    if grep -q '^ENABLE_HSTS=0' "$file" 2>/dev/null; then
      set_env_var ENABLE_HSTS "1"
      echo "==> ENABLE_HSTS=1 (HTTPS certificate active)"
      set -a
      # shellcheck disable=SC1091
      source "$file"
      set +a
      $COMPOSE up -d --no-deps --force-recreate api
    fi
  elif grep -q '^ENABLE_HSTS=1' "$file" 2>/dev/null; then
    set_env_var ENABLE_HSTS "0"
    echo "==> ENABLE_HSTS=0 (no HTTPS certificate — avoid browser HSTS lock)"
    set -a
    # shellcheck disable=SC1091
    source "$file"
    set +a
    $COMPOSE up -d --no-deps --force-recreate api
  fi
}

render_nginx() {
  local domain="${DOMAIN:-}"
  local infra="$(_infra_root)"

  if [[ "$domain" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    cp "$infra/nginx/default.bootstrap.conf" "$infra/nginx/default.conf"
    return
  fi

  if [[ -f "$infra/nginx/default.conf.template" ]] && [[ -n "$domain" ]] && ssl_cert_exists; then
    sed "s/DOMAIN_PLACEHOLDER/${domain}/g" "$infra/nginx/default.conf.template" >"$infra/nginx/default.conf"
    echo "==> Nginx config: HTTPS (${domain})"
  else
    cp "$infra/nginx/default.bootstrap.conf" "$infra/nginx/default.conf"
    echo "==> Nginx config: HTTP bootstrap"
  fi
}

maybe_enable_https() {
  local domain="${DOMAIN:-}"
  [[ -z "$domain" ]] && return 0
  [[ "$domain" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] && return 0
  [[ -z "${CERTBOT_EMAIL:-}" ]] && return 0

  if ssl_cert_exists; then
    return 0
  fi

  echo "==> Requesting Let's Encrypt certificate for ${domain}..."
  $COMPOSE run --rm --entrypoint certbot certbot certonly \
    --webroot -w /var/www/certbot \
    -d "$domain" \
    --email "$CERTBOT_EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    || echo "WARN: certbot failed — staying on HTTP until DNS/ports 80+443 are open"
}

ensure_admin_static_permissions() {
  local infra="$(_infra_root)"
  local dir="$infra/admin-static"

  if [[ ! -d "$dir" ]]; then
    echo "WARN: admin-static missing — run ./scripts/build-admin-web.sh"
    return 1
  fi

  chmod -R a+rX "$dir"
  # nginx needs traverse on the mount parent path inside the container bind mount
  chmod a+x "$infra" 2>/dev/null || true
  echo "==> admin-static permissions OK"
}

ensure_certbot_renew_loop() {
  $COMPOSE --profile certbot up -d certbot 2>/dev/null || true
}

nginx_config_test() {
  $COMPOSE exec -T nginx nginx -t 2>/dev/null
}

reload_nginx_stack() {
  echo "==> Reload Nginx (recreate)..."
  render_nginx

  if ! nginx_config_test; then
    echo "WARN: HTTPS nginx config invalid — falling back to HTTP bootstrap"
    cp "$(_infra_root)/nginx/default.bootstrap.conf" "$(_infra_root)/nginx/default.conf"
    nginx_config_test || {
      echo "ERROR: nginx config still invalid"
      $COMPOSE logs nginx --tail=40
      return 1
    }
  fi

  $COMPOSE up -d --force-recreate --remove-orphans nginx
  sleep 2
}

_http_code() {
  local url="$1"
  shift
  curl -sS --max-time 15 -o /dev/null -w "%{http_code}" "$@" "$url" 2>/dev/null || echo "000"
}

ensure_admin_serving() {
  local tries=0
  local url code
  local -a curl_extra=()

  if ssl_cert_exists && [[ -n "${DOMAIN:-}" ]]; then
    curl_extra=(-k -H "Host:${DOMAIN}")
    url="https://127.0.0.1/login/"
  else
    url="http://127.0.0.1/login/"
  fi

  ensure_admin_static_permissions || true

  while [[ $tries -lt 4 ]]; do
    code="$(_http_code "$url" -L "${curl_extra[@]}")"

    if [[ "$code" == "200" ]]; then
      echo "==> Admin panel serving OK (HTTP $code)"
      return 0
    fi

    echo "WARN: Admin login returned HTTP $code — fix permissions + recreate nginx (attempt $((tries + 1))/4)"
    ensure_admin_static_permissions || true
    reload_nginx_stack || true
    sleep 3
    tries=$((tries + 1))
  done

  echo "ERROR: Admin panel still not reachable after fixes"
  return 1
}

ensure_nginx_responding() {
  if $COMPOSE exec -T api wget -qO- http://127.0.0.1:3000/api/v1/health/ready 2>/dev/null | grep -q '"ready":true'; then
    :
  else
    echo "WARN: API container not ready"
    return 1
  fi

  ensure_admin_serving
}

build_admin_web_panel() {
  local infra="$(_infra_root)"
  chmod +x "$infra/scripts/build-admin-web.sh"
  maybe_enable_https
  "$infra/scripts/build-admin-web.sh"
  ensure_admin_static_permissions
}

public_scheme() {
  if ssl_cert_exists; then
    echo "https"
  else
    echo "http"
  fi
}

print_stack_urls() {
  local domain="${DOMAIN:-localhost}"
  local scheme
  scheme="$(public_scheme)"
  echo "  Admin:   ${scheme}://${domain}/login/"
  echo "  API:     ${scheme}://${domain}/api/v1/health"
  echo "  Ready:   ${scheme}://${domain}/api/v1/health/ready"
  echo "  Media:   ${scheme}://${domain}/media/"
  echo "  Catalog: ${scheme}://${domain}/catalog-hub/api/health"
}

detect_verify_base() {
  local domain="${DOMAIN:-localhost}"
  local code

  if ssl_cert_exists; then
    code="$(_http_code "https://127.0.0.1/login/" -k -H "Host:${domain}" -L)"
    if [[ "$code" == "200" ]]; then
      echo "https://${domain}"
      return
    fi
  fi

  code="$(_http_code "http://127.0.0.1/login/" -L)"
  if [[ "$code" == "200" ]]; then
    echo "http://127.0.0.1"
    return
  fi

  echo "http://${domain}"
}
