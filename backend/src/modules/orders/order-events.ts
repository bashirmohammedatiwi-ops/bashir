import { Injectable } from "@nestjs/common";
import { EventEmitter } from "events";

export interface OrderCancelledEvent {
  orderId: string;
  actorId?: string;
}

/**
 * أحداث الطلبات لوحدات أخرى (مثل الدفع الإلكتروني) دون اعتماد دائري بين الوحدات.
 */
@Injectable()
export class OrderEvents extends EventEmitter {
  emitCancelled(e: OrderCancelledEvent) {
    this.emit("cancelled", e);
  }

  onCancelled(fn: (e: OrderCancelledEvent) => void | Promise<void>) {
    this.on("cancelled", fn);
  }
}
