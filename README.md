# ed-github-app-token

This uses GitHub Apps to fetch a GitHub auth token for a GitHub App installation.
The GitHub App is used to authorize API access across multiple repositories.

## Development

Install the dependencies
```bash
$ bun i
```

Build the typescript and package it for distribution
```bash
$ bun run dist
```

## Usage

You will need to provide the GitHub App ID and private key. The action will then provide a `token` output.

```
  - name: my-app-install token
    id: my-app
    uses: EventDeer/EventDeer.DevOps.TokenAction@v1
    with:
      app_id: ${{ secrets.APP_ID }}
      private_key: ${{ secrets.APP_PRIVATE_KEY }}

  - name: Checkout private repo
    uses: actions/checkout@v4
    with:
      repository: your-org/your-private-repo
      token: ${{ steps.my-app.outputs.token }}
```
