// my-serializer-module
const prettyFormatToJSON = {
  print(val: any, serialize: (val: any) => string, indent: any) {
    return serialize(JSON.stringify(val, undefined, 2));
  },

  test(value: any) {
    console.log({ value });

    return value && value.input && value.output;
  }
};

export { prettyFormatToJSON };
