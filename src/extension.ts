import * as vscode from 'vscode';
import untildify from 'untildify';
import * as tmp from 'tmp';
import * as child_process from 'child_process';
import * as fs from "fs";
import * as util from './util';

export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "ansible-vault-inline" is now active!');

	var toggleEncrypt = async () => {
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		let config = vscode.workspace.getConfiguration('ansibleVaultInline');
		let doc = editor.document;
		let keypath = "";
		let pass : any = "";

		let rootPath = util.getRootPath(editor.document.uri);
		let keyInCfg = util.scanAnsibleCfg(rootPath);

		if (!!keyInCfg) {
			vscode.window.showInformationMessage(`Getting vault keyfile from ${keyInCfg}`);
		} else {
			// Found nothing from ansible.cfg

			if (!!config.keyfile) {
				keypath = untildify(config.keyfile.trim("/").trim("/"));
			}

			// Need user to input the ansible-vault pass
			if (!keypath) {
				pass = config.keypass;

				if (!pass) {
					await vscode.window.showInputBox({ prompt: "Enter the ansible-vault keypass: " }).then((val) => {
						pass = val;
					});
				}

				keypath = tmp.tmpNameSync();
				fs.writeFile(keypath, pass, (err) => {
					if (err) {
						return console.error(err);
					}
					console.log("Wrote password to temporary file ${keypath}");
				});
			}
		}

		// Go encrypt / decrypt
		let fileType = await checkFileType(doc.fileName);
		if (fileType === "plaintext") {
			encrypt(doc.fileName, rootPath, keyInCfg, keypath, config);
		} else if (fileType === "encrypted") {
			decrypt(doc.fileName, rootPath, keyInCfg, keypath, config);
		}

		if (!!pass && !!keypath) {
			fs.unlink(keypath, (err) => {
				if (err) {
					return console.error(err);
				}
				console.log("Removed temporary file ${keypath}");
			});
		}
	};

	let disposable = vscode.commands.registerCommand('extension.ansibleVaultInline', toggleEncrypt);
	context.subscriptions.push(disposable);
}

export function deactivate() {}

// Check YAML file content. If it starts with '$ANSIBLE_VAULT': `decrypt`, otherwise: `encrypt`.
let checkFileType = async (f : string) => {
	let content = '';
	await vscode.workspace.openTextDocument(f).then((document) => {
		content = document.getText();
	});

	if (content.indexOf("$ANSIBLE_VAULT") === 0) {
		return 'encrypted';
	}

	return 'plaintext';
};

let encrypt = (f : string, rootPath : string | undefined, keyInCfg : string, pass : string, config : vscode.WorkspaceConfiguration) => {
	console.log(`Encrypt: ${f}`);

	let cmd = `${config.executable} encrypt "${f}"`;
	// Specify `--vault-password-file` when `vault_password_file` is not in `ansible.cfg`.
	if (!keyInCfg) {
		cmd += ` --vault-password-file="${pass}"`;
	}

	if (!!rootPath) {
		exec(cmd, { cwd: rootPath });
	} else {
		exec(cmd);
	}

	vscode.window.showInformationMessage(`${f} encrypted`);
};

let decrypt = (f : string, rootPath : string | undefined, keyInCfg : string, pass : string, config : vscode.WorkspaceConfiguration) => {
	console.log(`Decrypt: ${f}`);

	let cmd = `${config.executable} decrypt "${f}"`;
	// Specify `--vault-password-file` when `vault_password_file` is not in `ansible.cfg`.
	if (!keyInCfg) {
		cmd += ` --vault-password-file="${pass}"`;
	}

	if (!!rootPath) {
		exec(cmd, { cwd: rootPath });
	} else {
		exec(cmd);
	}

	vscode.window.showInformationMessage(`${f} decrypted`);
};

let exec = (cmd : string, opt = {}) => {
	console.log(`> ${cmd}`);
	let stdout = child_process.execSync(cmd, opt);
};
