# VSCode ansible-vault-inline extension

[![Version Badge](https://img.shields.io/vscode-marketplace/v/wolfmah.ansible-vault-inline.svg?style=flat-square&label=marketplace)](https://marketplace.visualstudio.com/items?itemName=wolfmah.ansible-vault-inline)
[![Installs Badge](https://img.shields.io/vscode-marketplace/i/wolfmah.ansible-vault-inline.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=wolfmah.ansible-vault-inline)
[![Rating Badge](https://img.shields.io/vscode-marketplace/r/wolfmah.ansible-vault-inline.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=wolfmah.ansible-vault-inline)
[![License Badge](https://img.shields.io/badge/License-MPL%202.0-blue.svg?style=flat-square)](https://www.mozilla.org/en-US/MPL/2.0/)

VSCode extensions to encrypt/decrypt `ansible-vault` file as well as selected text. Can toggle with <kbd>`ctl+alt+0`</kbd>, on macOS with <kbd>`cmd+alt+0`</kbd>, or via the contextual menu.

_Fork of [dhoeric/vscode-ansible-vault](https://github.com/dhoeric/vscode-ansible-vault), which in turn was inspired by [sydro/atom-ansible-vault](https://github.com/sydro/atom-ansible-vault)_


## Usage

To read vault password file in your computer, you can specify the `vault_password_file` in ansible.cfg or through [extension settings](#extension-settings).


## Requirements

- Ansible


## Extension Settings

This extension contributes the following settings:

* `ansibleVaultInline.executable`: Full path of ansible-vault executable (e.g. `/usr/local/bin/ansible-vault`)
* `ansibleVaultInline.keyfile`: Ansible-vault password file path (e.g. `~/.vault-pass.txt`)
* `ansibleVaultInline.keypass`: Ansible-vault password text (e.g. `GT6rAP7rxYzeFC1KtHVW`)


## Developement

### Build

```
npm install
npm run compile
```

### Publish

* Change version
```
npm version [major|minor|patch] --no-git-tag-version
```
* Update `CHANGELOG.md`
* Publish the extension. See documentation for more info on how to login and for more advance options: [VSCode: Publishing Extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).
```
vsce publish --pat X_PERSONAL_ACCESS_TOKEN_X
```
* Create a release in Gitlab
```
curl --header 'Content-Type: application/json' --header "PRIVATE-TOKEN: X_ACCESS_TOKEN_X" --data '{ "name": "Release x.x.x", "tag_name": "x.x.x", "description": "# CHANGELOG\n## [x.x.x] - 2019-10-21\n### Added\n- Initial release" }' --request POST https://gitlab.com/api/v4/projects/14922723/releases
```
