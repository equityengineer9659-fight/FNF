#!/usr/bin/env node

/**
 * Rollback Script for Food-N-Force Website
 * Git-based rollback aligned with ADR-015 (SiteGround deployment via CI/CD).
 *
 * Strategy: git revert the chosen commit range, then push to master so the
 * existing GitHub Actions pipeline rebuilds and deploys to SiteGround.
 */

import { execSync } from 'node:child_process';
import { createInterface } from 'node:readline';

class RollbackManager {
  constructor() {
    this.rl = createInterface({ input: process.stdin, output: process.stdout });
  }

  run(cmd, opts = {}) {
    return execSync(cmd, { encoding: 'utf8', ...opts }).trim();
  }

  ask(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => resolve(answer.trim()));
    });
  }

  async rollback() {
    console.log('🔄 Food-N-Force Website Rollback Tool');
    console.log('   Strategy: git revert → push → CI/CD redeploys to SiteGround\n');
    console.log('='.repeat(50));

    try {
      // Ensure clean working tree
      const status = this.run('git status --porcelain');
      if (status) {
        throw new Error('Working tree is not clean. Commit or stash your changes before rolling back.');
      }

      // Ensure we are on master
      const branch = this.run('git rev-parse --abbrev-ref HEAD');
      if (branch !== 'master') {
        throw new Error(`You must be on the master branch to rollback (currently on ${branch}).`);
      }

      // Show recent commits
      console.log('\n📋 Recent production commits:\n');
      const logOutput = this.run('git log --oneline -10');
      const commits = logOutput.split('\n').map((line) => {
        const [hash, ...rest] = line.split(' ');
        return { hash, message: rest.join(' ') };
      });

      commits.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.hash} ${c.message}`);
      });

      // Get user selection
      console.log('');
      const answer = await this.ask(
        'Enter the number of the commit to revert TO (all commits after it will be reverted), or "q" to quit: '
      );

      if (answer.toLowerCase() === 'q') {
        console.log('❌ Rollback cancelled.');
        return;
      }

      const index = parseInt(answer, 10) - 1;
      if (isNaN(index) || index < 1 || index >= commits.length) {
        console.log('❌ Invalid selection. Choose a number between 2 and ' + commits.length);
        return;
      }

      const targetCommit = commits[index];
      const headCommit = commits[0];

      console.log(`\n⚠️  This will revert all commits from ${headCommit.hash} back to (but not including) ${targetCommit.hash}:`);

      // Show the commits that will be reverted
      const revertRange = this.run(`git log --oneline ${targetCommit.hash}..HEAD`);
      console.log('');
      revertRange.split('\n').forEach((line) => console.log(`   ↩ ${line}`));

      const confirm = await this.ask('\nAre you sure you want to proceed? (y/N): ');
      if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
        console.log('❌ Rollback cancelled.');
        return;
      }

      // Perform the revert
      console.log('\n🔄 Reverting commits...');
      this.run(`git revert --no-commit ${targetCommit.hash}..HEAD`);

      // Commit the revert
      const message = `Rollback to ${targetCommit.hash}: ${targetCommit.message}`;
      this.run(`git commit -m "${message.replace(/"/g, '\\"')}"`);
      console.log(`✅ Revert committed: ${message}`);

      // Push to trigger CI/CD
      const push = await this.ask('\nPush to master to trigger deployment? (y/N): ');
      if (push.toLowerCase() === 'y' || push.toLowerCase() === 'yes') {
        console.log('🚀 Pushing to master...');
        this.run('git push origin master');
        console.log('✅ Pushed! GitHub Actions will build and deploy to SiteGround.');
        console.log('   Monitor the deployment at: https://github.com/<owner>/<repo>/actions');
      } else {
        console.log('ℹ️  Revert committed locally. Push to master when ready to deploy.');
      }

      console.log('\n🎉 Rollback complete.');

    } catch (error) {
      console.error(`\n❌ Rollback failed: ${error.message}`);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }
}

const manager = new RollbackManager();
manager.rollback();
