/*
 * Copyright 2023 Albert Heijn Technology
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * 	https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Config } from "@backstage/config";
import {
  AnalyticsApi,
  AnalyticsEvent,
  IdentityApi,
} from "@backstage/core-plugin-api";
import {
  ApplicationInsights,
  Snippet,
} from "@microsoft/applicationinsights-web";
import { DeferredCapture } from "../util/DeferredCapture";

type AzureAnalyticsConfig = {
  connectionString: string;
};

export class AzureInsights implements AnalyticsApi {
  private readonly capture: DeferredCapture;
  private readonly appInsights: ApplicationInsights;

  private constructor(options: {
    identityApi: IdentityApi;
    azureConfig?: AzureAnalyticsConfig;
    azureSnippet?: Snippet;
  }) {
    const { identityApi, azureConfig, azureSnippet } = options;

    const appInsights = new ApplicationInsights({
      ...azureSnippet,
      config: {
        ...azureSnippet?.config,
        ...azureConfig,
      },
    });

    appInsights.loadAppInsights();

    this.capture = new DeferredCapture({ defer: true, appInsights });
    this.appInsights = appInsights;

    this.setUserFrom(identityApi);
  }

  static fromConfig(
    config: Config,
    identityApi: IdentityApi,
    azureSnippet?: Snippet
  ) {
    const azureConfig: AzureAnalyticsConfig | undefined = config.getOptional(
      "app.analytics.azure"
    );

    if (!azureConfig) {
      return {
        captureEvent: () => {},
      };
    }

    return new AzureInsights({
      identityApi,
      azureConfig,
      azureSnippet,
    });
  }

  captureEvent(event: AnalyticsEvent) {
    const { context, action, subject, value, attributes } = event;

    if (action === "navigate" && context.extension === "App") {
      // Track page view
      this.capture.pageview(subject, {
        pluginId: context.pluginId,
        routeRef: context.routeRef,
      });

      return;
    }

    this.capture.event(action, {
      category: context.extension || "App",
      label: subject,
      attributes,
      value,
    });
  }

  private async setUserFrom(identityApi: IdentityApi) {
    if (!this.appInsights) {
      return;
    }

    const { userEntityRef } = await identityApi.getBackstageIdentity();
    // Prevent PII from being passed to Azure Application Insights
    const userId = await this.hash(userEntityRef);

    this.appInsights.setAuthenticatedUserContext(userId);

    // We now have the user set, so we can start capturing events
    this.capture.setReady();
  }

  /**
   * Simple hash function; relies on web cryptography + the sha-256 algorithm.
   */
  private async hash(value: string): Promise<string> {
    const digest = await window.crypto.subtle.digest(
      "sha-256",
      new TextEncoder().encode(value)
    );
    const hashArray = Array.from(new Uint8Array(digest));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
}
