/** Orders online actions and discards the entire previous connection's queue after a disconnect. */
export class WriteQueue {
  private epoch = 0;
  private connected = false;
  private tail: Promise<void> = Promise.resolve();
  private aborts = new Set<AbortController>();

  setConnected(connected: boolean) {
    this.connected = connected;
    if (!connected) {
      this.epoch++;
      this.aborts.forEach(controller => controller.abort());
    }
  }

  run(action: (signal: AbortSignal) => Promise<void>): Promise<void> {
    const epoch = this.epoch;
    if (!this.connected) return Promise.reject(new Error('Disconnected — action was not shared'));
    const write = this.tail.then(async () => {
      if (!this.connected || epoch !== this.epoch) throw new Error('Disconnected — action was not shared');
      const controller = new AbortController();
      this.aborts.add(controller);
      try { await action(controller.signal); }
      finally { this.aborts.delete(controller); }
    });
    this.tail = write.catch(() => {});
    return write;
  }
}
