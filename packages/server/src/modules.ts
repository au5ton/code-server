import * as fs from "fs";
import * as path from "path";

declare var __non_webpack_require__: typeof require;

/**
 * Handling of native modules within the CLI
 */
export const setup = (dataDirectory: string): void => {
	if (!process.env.CLI) {
		return;
	}

	try {
		fs.mkdirSync(path.join(dataDirectory, "modules"));
	} catch (ex) {
		if (ex.code !== "EEXIST") {
			throw ex;
		}
	}

	const unpackModule = (moduleName: string): void => {
		const memFile = path.join(process.env.BUILD_DIR!, "build/modules", moduleName + ".node");
		const diskFile = path.join(dataDirectory, "modules", moduleName + ".node");
		if (!fs.existsSync(diskFile)) {
			fs.writeFileSync(diskFile, fs.readFileSync(memFile));
		}
	};

	/**
	 * We need to unpack node-pty and patch its `loadNative` function to require our unpacked pty.node
	 * If pty.node isn't unpacked a SIGSEGV is thrown and the application exits. The exact reasoning
	 * for this is unknown ATM, but this patch works around it.
	 */
	unpackModule("pty");
	const nodePtyUtils = require("../../protocol/node_modules/node-pty/lib/utils") as typeof import("../../protocol/node_modules/node-pty/src/utils");
	nodePtyUtils.loadNative = (modName: string) => {
		return __non_webpack_require__(path.join(dataDirectory, "modules", modName + ".node"));
	};
	require("../../protocol/node_modules/node-pty/lib/index") as typeof import("../../protocol/node_modules/node-pty/src/index");
};