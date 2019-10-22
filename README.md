# VSCode ansible-vault-inline extension
[![Visual Studio Marketplace](https://img.shields.io/vscode-marketplace/w/wolfmah.ansible-vault-inline.svg)](https://marketplace.visualstudio.com/items?itemName=wolfmah.ansible-vault-inline)

VSCode extensions to encrypt/decrypt ansible-vault file as well as selected text. Can toggle with <kbd>ctl+alt+0</kbd>, on macOS with <kbd>cmd+alt+0</kbd>.

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
