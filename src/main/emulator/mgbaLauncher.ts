export interface MgbaLaunchRequest {
  mgbaPath: string;
  romPath: string;
}

export const launchMgba = async (_request: MgbaLaunchRequest) => {
  throw new Error('mGBA launching is planned for a later milestone.');
};
