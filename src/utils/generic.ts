export const sleep = (milliseconds: number) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};

type tryAtMostOption = {
  maxRetries: number;
  retryInterval: number;
};

export async function tryAtMost<T>(
  options: tryAtMostOption,
  promise: Promise<T>
): Promise<T> {
  const { maxRetries, retryInterval } = options;

  try {
    // try doing the important thing
    const promiseResult = await promise;

    return promiseResult;
  } catch (err) {
    if (maxRetries > 0) {
      const _option = {
        ...options,
        maxRetries: maxRetries - 1
      };
      _option;

      try {
        await sleep(retryInterval);

        // NOTE: FOR SOME REASON THE TRY_AT_MOST NOT NEED THE AWAIT KEYWORD HERE
        // I'M JUST A HUMAN, SORRY

        const _promiseResult = tryAtMost(_option, promise);

        return _promiseResult;
      } catch (err) {
        throw err;
      }
    } else {
      throw err;
    }
  }
}
