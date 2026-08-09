export const loggerOptions = {
  level: process.env.LOG_LEVEL ?? "info",

  base: undefined,

  serializers: {
    req(request: unknown) {
      return request;
    },

    res(response: unknown) {
      return response;
    },

    err(error: unknown) {
      return error;
    },
  },
};
