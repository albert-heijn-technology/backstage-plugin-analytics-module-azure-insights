# Analytics Module: Azure Application Insights

This plugin provides an opinionated implementation of the Backstage Analytics
API for Azure Application Insights. Once installed and configured, analytics events will
be sent to Azure as your users navigate and use your Backstage instance.

This plugin contains no other functionality.

## Installation

1. Install the plugin package in your Backstage app:

   ```sh
   # From your Backstage root directory
   yarn add --cwd packages/app @albert-heijn-technology/plugin-analytics-module-azure-insights
   ```

2. Wire up the API implementation to your App:

   ```tsx
   // packages/app/src/apis.ts
   import {
     analyticsApiRef,
     configApiRef,
     identityApiRef,
   } from '@backstage/core-plugin-api';
   import { AzureInsights } from '@albert-heijn-technology/plugin-analytics-module-azure-insights';

   export const apis: AnyApiFactory[] = [
     // Instantiate and register the Azure Insights API Implementation.
     createApiFactory({
       api: analyticsApiRef,
       deps: { configApi: configApiRef, identityApi: identityApiRef },
       factory: ({ configApi, identityApi }) =>
         AzureInsights.fromConfig(configApi, identityApi),
     }),
   ];
   ```

3. Configure the plugin in your `app-config.yaml`:

    The following is the minimum configuration required to start sending analytics
    events to Azure. All that's needed is your connectionString

    ```yaml
    # app-config.yaml
    app:
      analytics:
        azure:
          connectionString: 'InstrumentationKey=abc123'
    ```

## Azure config

In order to configure azure, you can add the following azureSnippet to the apiFactory. For all supported configuration see the [SDK docs](https://github.com/microsoft/ApplicationInsights-JS#configuration).

```ts
  const azureSnippet = {
    config: {
      disableFetchTracking: true,
      disableAjaxTracking: true,
      disableExceptionTracking: true,
    }
  }

  createApiFactory({
    api: analyticsApiRef,
    deps: { configApi: configApiRef, identityApi: identityApiRef },
    factory: ({ configApi, identityApi }) =>
      AzureInsights.fromConfig(configApi, identityApi, azureSnippet),
  }),
```
