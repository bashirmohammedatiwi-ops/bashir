"use client";
import { Component, type ReactNode } from "react";
import { reportClientError } from "@/lib/reportError";

/** يعزل قسماً من الصفحة: إن تعطل يختفي وحده (ويُبلَّغ عنه) بدل أن تسقط الصفحة كلها على «حدث خطأ». */
export class SafeSection extends Component<{ name: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    reportClientError(`section:${this.props.name}`, error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
