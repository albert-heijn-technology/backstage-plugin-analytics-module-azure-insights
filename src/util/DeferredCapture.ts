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

import { ApplicationInsights } from "@microsoft/applicationinsights-web";

type PageViewHit = {
  type: "pageView";
  uri: string;
  properties: {
    [x: string]: any;
  };
};

type EventHit = {
  type: "event";
  name: string;
  properties: {
    [x: string]: any;
  };
};

type Hit = {
  data: PageViewHit | EventHit;
};

export class DeferredCapture {
  /**
   * Queue of deferred hits to be processed when ready. When undefined, hits
   * can safely be sent without delay.
   */
  private queue: Hit[] | undefined;
  private readonly appInsights: ApplicationInsights;

  constructor({
    defer = false,
    appInsights,
  }: {
    defer: boolean;
    appInsights: ApplicationInsights;
  }) {
    this.queue = defer ? [] : undefined;
    this.appInsights = appInsights;
  }

  /**
   * Indicates that deferred capture may now proceed.
   */
  setReady() {
    if (this.queue) {
      this.queue.forEach((hit) => this.sendDeferred(hit));
      this.queue = undefined;
    }
  }

  /**
   * Either forwards the pageview directly to Azure, or enqueues
   * the pageview hit to be captured when ready.
   */
  pageview(uri: string, properties: { [key: string]: any }) {
    if (this.queue) {
      this.queue.push({
        data: {
          type: "pageView",
          uri,
          properties,
        },
      });
      return;
    }

    this.appInsights.trackPageView({
      uri,
      properties,
    });
  }

  event(name: string, properties: { [key: string]: any }) {
    if (this.queue) {
      this.queue.push({
        data: {
          type: "event",
          name,
          properties,
        },
      });
      return;
    }

    this.appInsights.trackEvent(
      {
        name,
      },
      properties
    );
  }

  /**
   * Sends a given hit to Azure
   */
  private sendDeferred(hit: Hit) {
    if (hit.data.type === "pageView") {
      this.appInsights.trackPageView({
        ...hit.data,
      });
      return;
    }

    if (hit.data.type === "event") {
      this.appInsights.trackEvent(
        {
          name: hit.data.name,
        },
        hit.data.properties
      );
    }
  }
}
