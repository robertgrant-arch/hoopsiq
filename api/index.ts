import { createApp } from "../server/app";

// Single Express app instance — created once on cold start, reused across invocations.
export default createApp();
