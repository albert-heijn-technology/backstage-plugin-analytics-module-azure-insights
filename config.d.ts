export interface Config {
  app: {
    analytics?: {
      azure: {
        /** @visibility frontend */
        connectionString: string;
      };
    };
  };
}
