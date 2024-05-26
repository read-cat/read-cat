
export const useGithubDownloadProxy = () => {
  const proxys = [{
    value: 'https://mirror.ghproxy.com',
  }, {
    value: 'https://ghproxy.net',
  }];
  const querySearch = (_: string, cb: any) => {
    cb(proxys);
  }

  return {
    querySearch,
  }
}