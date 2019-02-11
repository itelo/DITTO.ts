export default {
  type: Number,
  get: Math.round,
  set: Math.round,
  validate: {
    validator: (value: number) => {
      return Number.isInteger(value);
    },
    message: (props: { value: string }) => `${props.value} is not integer!`
  }
};
