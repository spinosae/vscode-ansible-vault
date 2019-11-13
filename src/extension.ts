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

		let selection = editor.selection;
		if (!selection) {
			return;
		}

		let config = vscode.workspace.getConfiguration('ansibleVaultInline');
		let doc = editor.document;
		let keypath = "";
		let pass : any = "";

		// Read `ansible.cfg` 
		let rootPath = util.getRootPath(editor.document.uri);
		let keyInCfg = util.scanAnsibleCfg(rootPath);

		// Extract `ansible-vault` password
		if (!!keyInCfg) {
			console.log(`Getting vault keyfile from ${keyInCfg}`);
			vscode.window.showInformationMessage(`Getting vault keyfile from ${keyInCfg}`);
		} else {
			console.log(`Found nothing from config files`);

			if (!!config.keyfile) {
				keypath = untildify(config.keyfile.trim('/'));
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
				fs.writeFileSync(keypath, pass, 'utf8');
				console.log(`Wrote password to temporary file: '${keypath}'`);
			}
		}

		const text = editor.document.getText(selection);

		// Go encrypt / decrypt
		if (!!text) {
			let type = getInlineTextType(text);

			if (type === 'plaintext') {
				console.log(`Encrypt selected text`);

				let encryptedText = "!vault |\n"+encryptInline(text, rootPath, keyInCfg, keypath, config);
				editor.edit(editBuilder => {
					editBuilder.replace(selection, encryptedText.replace(/\n/g,'\n'+" ".repeat(selection.start.character)));
				});
			} else if (type === 'encrypted') {
				console.log(`Decrypt selected text`);

				let decryptedText = decryptInline(text, rootPath, keyInCfg, keypath, config);
				editor.edit(editBuilder => {
					editBuilder.replace(selection, decryptedText);
				});
			}
		} else {
			let content = '';
			await vscode.workspace.openTextDocument(doc.fileName).then((document) => {
				content = document.getText();
			});
			let type = getTextType(content);

			if (type === 'plaintext') {
				console.log(`Encrypt entire file`);

				encryptFile(doc.fileName, rootPath, keyInCfg, keypath, config);
				vscode.window.showInformationMessage(`File encrypted: '${doc.fileName}'`);
			} else if (type === 'encrypted') {
				console.log(`Decrypt entire file`);

				decryptFile(doc.fileName, rootPath, keyInCfg, keypath, config);
				vscode.window.showInformationMessage(`File decrypted: '${doc.fileName}'`);
			}
		}

		if (!!pass && !!keypath) {
			fs.unlinkSync(keypath);
			console.log(`Removed temporary file: '${keypath}'`);
		}
	};

	let disposable = vscode.commands.registerCommand('extension.ansibleVaultInline', toggleEncrypt);
	context.subscriptions.push(disposable);
}

export function deactivate() {}

// Returns wheter the selected text is encrypted or in plain text.
let getInlineTextType = (text : string) => {
	if (text.trim().startsWith('!vault |')) {
		text = text.replace('!vault |', '');
	}

	return (text.trim().startsWith('$ANSIBLE_VAULT;')) ? 'encrypted' : 'plaintext';
};

// Returns wheter the file is encrypted or in plain text.
let getTextType = (text : string) => {
	return (text.indexOf('$ANSIBLE_VAULT;') === 0) ? 'encrypted' : 'plaintext';
};

let encryptInline = (text : string, rootPath : string | undefined, keyInCfg : string, pass : string, config : vscode.WorkspaceConfiguration) => {
	let tmpFilename = tmp.tmpNameSync();
	fs.writeFileSync(tmpFilename, Buffer.from(text, 'utf8'));
	console.log(`Wrote encrypted string to temporary file '${tmpFilename}'`);

	encryptFile(tmpFilename, rootPath, keyInCfg, pass, config);
	let encryptedText = fs.readFileSync(tmpFilename, 'utf8');
	console.log(`encryptedText == '${encryptedText}'`);

	if (!!tmpFilename) {
		fs.unlinkSync(tmpFilename);
		console.log(`Removed temporary file: '${tmpFilename}'`);
	}

	return encryptedText.trim();
};

let decryptInline = (text : string, rootPath : string | undefined, keyInCfg : string, pass : string, config : vscode.WorkspaceConfiguration) => {
	// Delete inline vault prefix, then trim spaces and newline from the entire string and, at last, trim the spaces in the multiline string.
	text = text.replace('!vault |', '').trim().replace(/[^\S\r\n]+/gm, '');

	let tmpFilename = tmp.tmpNameSync();
	fs.writeFileSync(tmpFilename, Buffer.from(text, 'utf8'));
	console.log(`Wrote encrypted string to temporary file '${tmpFilename}'`);

	decryptFile(tmpFilename, rootPath, keyInCfg, pass, config);
	let decryptedText = fs.readFileSync(tmpFilename, 'utf8');
	console.log(`decryptedText == '${decryptedText}'`);

	if (!!tmpFilename) {
		fs.unlinkSync(tmpFilename);
		console.log(`Removed temporary file: '${tmpFilename}'`);
	}

	return decryptedText;
};

let encryptFile = (f : string, rootPath : string | undefined, keyInCfg : string, pass : string, config : vscode.WorkspaceConfiguration) => {
	console.log(`Encrypt file: ${f}`);

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
};

let decryptFile = (f : string, rootPath : string | undefined, keyInCfg : string, pass : string, config : vscode.WorkspaceConfiguration) => {
	console.log(`Decrypt file: ${f}`);

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
};

let exec = (cmd : string, opt = {}) => {
	console.log(`> ${cmd}`);
	return child_process.execSync(cmd, opt);
};
