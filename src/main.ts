import {createAppAuth} from '@octokit/auth-app';
import {Octokit} from '@octokit/rest';
import {Endpoints} from '@octokit/types';
import * as core from '@actions/core';

type listInstallationsResponse =
  Endpoints['GET /app/installations']['response'];

async function run(): Promise<void> {
  try {
    const privateKey: string = core.getInput('private_key');
    const appId: string = core.getInput('app_id');
    const scope: string = core.getInput('scope');
    const appOctokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId,
        privateKey,
      },
      baseUrl: process.env.GITHUB_API_URL || 'https://api.github.com',
    });

    const installations: listInstallationsResponse =
      await appOctokit.apps.listInstallations();
    let installationId = installations.data[0].id;
    if (scope !== '') {
      const scopedData = installations.data.find(
        (item) =>
          item.account &&
          'login' in item.account &&
          item.account?.login === scope
      );
      if (scopedData === undefined) {
        throw new Error(`set scope is ${scope}, but installation is not found`);
      }
      installationId = scopedData.id;
    }

    const permissionsAsRecord: Record<string, string> = {};

    if (core.getInput('permissions') !== '') {
      const permissions = core.getInput('permissions').split(',');
      for (const permission of permissions) {
        const [name, value] = permission.split('=');
        if (name && value) {
          permissionsAsRecord[name.trim()] = value.trim();
        } else {
          throw new Error(`Invalid permission format: ${permission}`);
        }
      }
    } else {
      // Default permissions if not provided
      permissionsAsRecord['contents'] = 'read';
      permissionsAsRecord['checks'] = 'write';
      permissionsAsRecord['actions'] = 'write';
      permissionsAsRecord['administration'] = 'write';
    }

    // This is untyped
    // See: https://github.com/octokit/core.js/blob/master/src/index.ts#L182-L183
    const resp = await appOctokit.auth({
      type: 'installation',
      installationId,
      permissions: permissionsAsRecord,
    });

    if (!resp) {
      throw new Error('Unable to authenticate');
    }

    // @ts-expect-error
    core.setSecret(resp.token);
    // @ts-expect-error
    core.setOutput('token', resp.token);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
