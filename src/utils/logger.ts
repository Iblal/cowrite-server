import pino from "pino";
import dayjs from "dayjs";

const log = pino({
  base: {
    pid: false,
  },
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
  timestamp: () => `,"time":"${dayjs().toISOString()}"`,
});

export default log;
