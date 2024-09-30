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

import { ConfigReader } from "@backstage/config";
import { IdentityApi } from "@backstage/core-plugin-api";
import { AzureInsights } from "./AzureInsights";

Object.defineProperty(global, "crypto", {
  value: {
    subtle: {
      digest: jest.fn(),
    },
  },
});

const mockLoadAppInsights = jest.fn();
const mockSetAuthenticatedUserContext = jest.fn();
const mockTrackEvent = jest.fn();
const mockTrackPageView = jest.fn();

jest.mock("@microsoft/applicationinsights-web", () => {
  return {
    ApplicationInsights: jest.fn().mockImplementation(() => {
      return {
        loadAppInsights: mockLoadAppInsights,
        setAuthenticatedUserContext: mockSetAuthenticatedUserContext,
        trackEvent: mockTrackEvent,
        trackPageView: mockTrackPageView,
      };
    }),
  };
});

describe("AzureInsights", () => {
  const identityApi = {
    getBackstageIdentity: jest.fn().mockResolvedValue({
      userEntityRef: "User:default/someone",
    }),
  } as unknown as IdentityApi;

  describe("fromConfig", () => {
    it("returns implementation", async () => {
      const config = new ConfigReader({
        app: {
          analytics: {
            azure: {
              connectionString: "connectionString",
            },
          },
        },
      });

      const api = AzureInsights.fromConfig(config, identityApi);
      expect(mockLoadAppInsights).toHaveBeenCalled();

      expect(api.captureEvent).toBeDefined();

      // Event tracking
      api.captureEvent({
        action: "click",
        value: 6,
        subject: "subject",
        context: {
          extension: "extension",
          pluginId: "pluginId",
          routeRef: "routeRef",
        },
      });

      // Page tracking
      api.captureEvent({
        action: "navigate",
        subject: "/url-thing",
        context: {
          extension: "App",
          pluginId: "pluginId",
          routeRef: "routeRef",
        },
      });

      // The queue is making it so we need to wait one tick.
      await new Promise(process.nextTick);

      expect(mockSetAuthenticatedUserContext).toHaveBeenCalled();
      expect(mockTrackEvent).toHaveBeenCalledWith(
        {
          name: "click",
        },
        {
          attributes: undefined,
          category: "extension",
          label: "subject",
          value: 6,
        }
      );
      expect(mockTrackPageView).toHaveBeenCalledWith({
        properties: {
          pluginId: "pluginId",
          routeRef: "routeRef",
        },
        type: "pageView",
        uri: "/url-thing",
      });
    });
  });
});
