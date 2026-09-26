const realFetch = global.fetch;

export function mockUrlFetch(url: string, body: string): void {
  global.fetch = jest.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (requestUrl === url) {
        return {
          ok: true,
          status: 200,
          text: async () => body,
        } as Response;
      }

      return realFetch(input, init);
    },
  ) as unknown as typeof fetch;
}

export function restoreFetch(): void {
  global.fetch = realFetch;
}
