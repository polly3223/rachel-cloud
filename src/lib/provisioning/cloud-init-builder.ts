/**
 * Cloud-init user-data YAML builder for VPS provisioning.
 *
 * Generates cloud-config YAML that:
 * - Creates the 'rachel' user with sudo and SSH access
 * - Installs required packages (git, curl, unzip)
 * - Installs Bun runtime, GitHub CLI, and Claude Code CLI
 * - Clones Rachel8 repo and installs dependencies
 * - Creates shared folder structure
 * - Signals completion via phone_home callback to control plane
 *
 * CRITICAL: No secrets (Claude tokens, Telegram bot token) are included in
 * cloud-init user-data. Secrets are injected via SSH after cloud-init completes.
 * User-data is visible in Hetzner API responses and logs.
 *
 * @module cloud-init-builder
 */

import type { CloudInitConfig } from './types';

// Hetzner user-data size limit is 32 KiB; we enforce a 30 KB safety margin.
const MAX_USERDATA_BYTES = 30 * 1024;

/**
 * Build cloud-init user-data YAML for a new VPS.
 *
 * The generated YAML configures a fresh Ubuntu 24.04 server with everything
 * needed to run Rachel8, except secrets (injected later via SSH).
 *
 * @param config - Cloud-init configuration parameters
 * @returns Cloud-config YAML string starting with `#cloud-config\n`
 * @throws Error if the generated YAML exceeds the 30 KB safety limit
 *
 * @example
 * ```typescript
 * const userData = buildCloudInitUserData({
 *   username: 'rachel',
 *   sshPublicKey: 'ssh-rsa AAAAB3NzaC1yc2EA...',
 *   callbackUrl: 'https://rachel-cloud.example.com/api/provision/callback/user123',
 * });
 * ```
 */
export function buildCloudInitUserData(config: CloudInitConfig): string {
	const { username, sshPublicKey, callbackUrl } = config;

	const yaml = buildYaml(username, sshPublicKey, callbackUrl);
	const fullUserData = `#cloud-config\n${yaml}`;

	// Validate size against Hetzner's 32 KiB limit (with safety margin)
	const byteLength = new TextEncoder().encode(fullUserData).length;
	if (byteLength > MAX_USERDATA_BYTES) {
		throw new Error(
			`Cloud-init user-data exceeds size limit: ${byteLength} bytes ` +
				`(max ${MAX_USERDATA_BYTES} bytes, Hetzner limit is 32768 bytes)`
		);
	}

	return fullUserData;
}

/**
 * Build the YAML body for cloud-config.
 *
 * Uses manual YAML construction to keep full control over formatting and
 * avoid pulling in a YAML serialization library.
 */
function buildYaml(username: string, sshPublicKey: string, callbackUrl: string): string {
	const lines: string[] = [];

	// -------------------------------------------------------------------
	// Users: create the rachel user with sudo and SSH key
	// -------------------------------------------------------------------
	lines.push('users:');
	lines.push(`  - name: ${username}`);
	lines.push('    groups: [sudo]');
	lines.push('    sudo: "ALL=(ALL) NOPASSWD:ALL"');
	lines.push('    shell: /bin/bash');
	lines.push('    ssh_authorized_keys:');
	lines.push(`      - ${sshPublicKey}`);

	// -------------------------------------------------------------------
	// Packages: system packages installed via apt
	// -------------------------------------------------------------------
	lines.push('');
	lines.push('package_update: true');
	lines.push('packages:');
	lines.push('  - git');
	lines.push('  - curl');
	lines.push('  - unzip');
	lines.push('  - ffmpeg');
	lines.push('  - build-essential');
	lines.push('  - cmake');

	// -------------------------------------------------------------------
	// Run commands: install runtimes, clone repo, set up environment
	// -------------------------------------------------------------------
	lines.push('');
	lines.push('runcmd:');

	// 1. Install Bun runtime
	lines.push('  # Install Bun runtime');
	lines.push(`  - ["bash", "-c", "curl -fsSL https://bun.sh/install | bash -s -- --install-dir /home/${username}/.bun"]`);
	lines.push(`  - ["bash", "-c", "chown -R ${username}:${username} /home/${username}/.bun"]`);

	// 2. Add Bun to PATH in .bashrc
	lines.push('  # Add Bun to PATH');
	lines.push(
		`  - ["bash", "-c", "echo 'export BUN_INSTALL=\\"/home/${username}/.bun\\"' >> /home/${username}/.bashrc"]`
	);
	lines.push(
		`  - ["bash", "-c", "echo 'export PATH=\\"$BUN_INSTALL/bin:$PATH\\"' >> /home/${username}/.bashrc"]`
	);

	// 3. Install GitHub CLI
	lines.push('  # Install GitHub CLI');
	lines.push(
		'  - ["bash", "-c", "curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg"]'
	);
	lines.push(
		'  - ["bash", "-c", "echo \\"deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main\\" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null"]'
	);
	lines.push('  - ["bash", "-c", "apt update && apt install -y gh"]');

	// 4. Install Claude Code CLI (npm package via Bun)
	lines.push('  # Install Claude Code CLI');
	lines.push(
		`  - ["su", "-", "${username}", "-c", "/home/${username}/.bun/bin/bun install -g @anthropic-ai/claude-code"]`
	);

	// 5. Clone Rachel repository (from public repo)
	lines.push('  # Clone Rachel repository');
	lines.push(
		`  - ["su", "-", "${username}", "-c", "git clone https://github.com/polly3223/rachel.git /home/${username}/rachel8"]`
	);

	// 6. Install Rachel8 dependencies
	lines.push('  # Install Rachel8 dependencies');
	lines.push(
		`  - ["su", "-", "${username}", "-c", "cd /home/${username}/rachel8 && /home/${username}/.bun/bin/bun install"]`
	);

	// 7. Create shared folder for Rachel8 file operations
	lines.push('  # Create shared folder');
	lines.push(`  - ["mkdir", "-p", "/home/${username}/shared"]`);
	lines.push(`  - ["chown", "-R", "${username}:${username}", "/home/${username}/shared"]`);

	// -------------------------------------------------------------------
	// phone_home: signal completion to control plane
	// -------------------------------------------------------------------
	lines.push('');
	lines.push('phone_home:');
	lines.push(`  url: ${callbackUrl}`);
	lines.push('  post:');
	lines.push('    - instance_id');
	lines.push('    - hostname');
	lines.push('  tries: 10');

	return lines.join('\n') + '\n';
}
