import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("delete expired verification codes", { minutes: 30 }, internal.verificationCodes.deleteExpired);

export default crons;
