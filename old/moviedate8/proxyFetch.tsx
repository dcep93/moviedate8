const generic_extension_id = "kmpbdkipjlpbckfnpbfbncddjaneeklc";

declare global {
  interface Window {
    chrome: any;
  }
}

export var has_generic_extension: boolean | null = null;
checkForExt(generic_extension_id).then((_has_generic_extension) => {
  has_generic_extension = _has_generic_extension;
});

export function checkForExt(extension_id: string): Promise<boolean> {
  if (!window.chrome?.runtime) {
    return Promise.resolve(false);
  } else {
    return new Promise<boolean>((resolve, reject) =>
      window.chrome.runtime.sendMessage(extension_id, {}, (response: any) =>
        resolve(response !== undefined)
      )
    ).catch((err: Error) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      window.chrome.runtime.lastError;
      throw err;
    });
  }
}

export function ext(data: any): Promise<any> {
  return new Promise((resolve, reject) =>
    window.chrome.runtime.sendMessage(
      generic_extension_id,
      data,
      (response: any) => {
        if (window.chrome.runtime.lastError) {
          return reject(
            `chrome.runtime.lastError ${window.chrome.runtime.lastError}`
          );
        }
        if (!response.ok) {
          console.error(data, response);
          return reject(`chrome: ${response.err}`);
        }
        resolve(response.data);
      }
    )
  );
}

export function proxyFetchText(url: string, maxAgeMs: number): Promise<string> {
  return has_generic_extension
    ? ext({
        fetch: { url, maxAgeMs },
      }).then(({ msg }) => msg)
    : fetch("https://proxy420.appspot.com", {
        method: "POST",
        body: JSON.stringify({ maxAgeMs, url }),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((resp) => resp.text());
}
