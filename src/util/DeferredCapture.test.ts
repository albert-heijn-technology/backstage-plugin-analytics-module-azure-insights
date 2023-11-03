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
import { DeferredCapture } from "./DeferredCapture";

const appInsights = {
  trackPageView: jest.fn(),
  trackEvent: jest.fn(),
} as unknown as ApplicationInsights;

describe("DeferredCapture", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("PageView tracking", () => {
    it("enqueues the event until ready", async () => {
      const capture = new DeferredCapture({ defer: true, appInsights });

      capture.pageview("/test-page", {
        pluginId: "plugin-one",
        propertyOne: "property-one",
      });

      expect(appInsights.trackPageView).not.toHaveBeenCalled();

      capture.setReady();

      expect(appInsights.trackPageView).toHaveBeenCalledWith({
        properties: {
          pluginId: "plugin-one",
          propertyOne: "property-one",
        },
        type: "pageView",
        uri: "/test-page",
      });
      expect(appInsights.trackEvent).not.toHaveBeenCalled();
    });
  });

  describe("Event tracking", () => {
    it("enqueues the event until ready", async () => {
      const capture = new DeferredCapture({ defer: true, appInsights });

      capture.event("action", {
        category: "App",
        label: "Label",
        attributes: {
          attribute: "attribute-one",
        },
        value: 4,
      });

      expect(appInsights.trackEvent).not.toHaveBeenCalled();

      capture.setReady();

      expect(appInsights.trackEvent).toHaveBeenCalledWith(
        { name: "action" },
        {
          category: "App",
          label: "Label",
          attributes: {
            attribute: "attribute-one",
          },
          value: 4,
        }
      );
      expect(appInsights.trackPageView).not.toHaveBeenCalled();
    });
  });
});
