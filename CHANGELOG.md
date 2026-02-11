# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.13.4](https://github.com/amplitude/experiment-node-server/compare/v1.13.3...v1.13.4) (2026-02-11)


### Bug Fixes

* Enforce 60s cohort polling interval minimum ([#75](https://github.com/amplitude/experiment-node-server/issues/75)) ([6b94fc3](https://github.com/amplitude/experiment-node-server/commit/6b94fc3bb8a54355a941e0dbe4e87b53572db995))
* typeError in canonicalize() when user_id/device_id are non-strings ([#71](https://github.com/amplitude/experiment-node-server/issues/71)) ([01b9e7f](https://github.com/amplitude/experiment-node-server/commit/01b9e7f86e228fd38609c4f77968b212e9f0a4ba))





## [1.13.3](https://github.com/amplitude/experiment-node-server/compare/v1.13.2...v1.13.3) (2026-01-26)


### Bug Fixes

* replace remaining console log output with this.logger ([#67](https://github.com/amplitude/experiment-node-server/issues/67)) ([b640451](https://github.com/amplitude/experiment-node-server/commit/b640451e28b25b0cc1165836de7cefa056a1a3bb))





## [1.13.2](https://github.com/amplitude/experiment-node-server/compare/v1.13.1...v1.13.2) (2026-01-22)


### Bug Fixes

* update URL usage away from depracated usage ([#66](https://github.com/amplitude/experiment-node-server/issues/66)) ([9f391ad](https://github.com/amplitude/experiment-node-server/commit/9f391ad4c9625b31d4be1e22afd6a02b42463a9f))





## [1.13.1](https://github.com/amplitude/experiment-node-server/compare/v1.13.0...v1.13.1) (2026-01-17)


### Bug Fixes

* node resolution paths starting with `src/` don't work ([#63](https://github.com/amplitude/experiment-node-server/issues/63)) ([ed762a0](https://github.com/amplitude/experiment-node-server/commit/ed762a0eb25e39f808316fd222983c25e8650b25))





# [1.13.0](https://github.com/amplitude/experiment-node-server/compare/v1.12.1...v1.13.0) (2026-01-07)


### Features

* add exposure service ([#60](https://github.com/amplitude/experiment-node-server/issues/60)) ([126533f](https://github.com/amplitude/experiment-node-server/commit/126533f7e7fae1f3435a7b4e83935a3fd0516706))
* add tracks assignment and exposure ([#55](https://github.com/amplitude/experiment-node-server/issues/55)) ([e255b1c](https://github.com/amplitude/experiment-node-server/commit/e255b1cc130ae9496fdef647273a11f9d1d28ebe))





## [1.12.1](https://github.com/amplitude/experiment-node-server/compare/v1.12.0...v1.12.1) (2025-10-29)


### Bug Fixes

* export logging libs ([#58](https://github.com/amplitude/experiment-node-server/issues/58)) ([85a4fe6](https://github.com/amplitude/experiment-node-server/commit/85a4fe6157ae0616ed3cdc215c4df18ea8358534))





# [1.12.0](https://github.com/amplitude/experiment-node-server/compare/v1.11.0...v1.12.0) (2025-10-28)


### Features

* allow for better user defined logging behavior with logLevel and loggerProvider config fields ([#56](https://github.com/amplitude/experiment-node-server/issues/56)) ([bc62d52](https://github.com/amplitude/experiment-node-server/commit/bc62d520917bb2c34d80c82af53dd21482320078))





# [1.11.0](https://github.com/amplitude/experiment-node-server/compare/v1.10.1...v1.11.0) (2025-09-26)


### Bug Fixes

* CohortApi.getCohort() signature ([#53](https://github.com/amplitude/experiment-node-server/issues/53)) ([618c84e](https://github.com/amplitude/experiment-node-server/commit/618c84e443fcc30c707a6b9dfcba4657dc313b49))


### Features

* add isntanceName config ([#54](https://github.com/amplitude/experiment-node-server/issues/54)) ([8a905f7](https://github.com/amplitude/experiment-node-server/commit/8a905f776887d2b2d191e32b2bb60e84b0fbe7b4))





## [1.10.1](https://github.com/amplitude/experiment-node-server/compare/v1.10.0...v1.10.1) (2024-12-20)


### Bug Fixes

* when retries is set to zero, throw the error ([#51](https://github.com/amplitude/experiment-node-server/issues/51)) ([a10e726](https://github.com/amplitude/experiment-node-server/commit/a10e726ce89962b326537671c3bedf56c2e3f7ef))





# [1.10.0](https://github.com/amplitude/experiment-node-server/compare/v1.9.0...v1.10.0) (2024-08-27)


### Features

* Add cohort sync ([#49](https://github.com/amplitude/experiment-node-server/issues/49)) ([74221bf](https://github.com/amplitude/experiment-node-server/commit/74221bf6644c70f0a0db0760fe139c2f717d53ba))





# [1.9.0](https://github.com/amplitude/experiment-node-server/compare/v1.8.3...v1.9.0) (2024-03-15)


### Features

* add stream support ([#42](https://github.com/amplitude/experiment-node-server/issues/42)) ([70b1f94](https://github.com/amplitude/experiment-node-server/commit/70b1f94e53ff8b0212ac89b6fa4fa451c067b946))





## [1.8.3](https://github.com/amplitude/experiment-node-server/compare/v1.8.2...v1.8.3) (2024-02-29)


### Bug Fixes

* support http serverUrl ([a0bd3b6](https://github.com/amplitude/experiment-node-server/commit/a0bd3b602f8cfb57d950aec9ed29549e42906a24))





## [1.8.2](https://github.com/amplitude/experiment-node-server/compare/v1.8.1...v1.8.2) (2024-01-31)


### Bug Fixes

* Improve remote evaluation fetch retry logic ([#40](https://github.com/amplitude/experiment-node-server/issues/40)) ([525cf0f](https://github.com/amplitude/experiment-node-server/commit/525cf0f48e3ed53cf6f57d42087fbe961315324b))





## [1.8.1](https://github.com/amplitude/experiment-node-server/compare/v1.8.0...v1.8.1) (2024-01-19)


### Bug Fixes

* add IP property to user object ([#39](https://github.com/amplitude/experiment-node-server/issues/39)) ([9b67eee](https://github.com/amplitude/experiment-node-server/commit/9b67eee008728b6fbcfe0d96da24a2910ea6c885))





# [1.8.0](https://github.com/amplitude/experiment-node-server/compare/v1.7.8...v1.8.0) (2023-12-01)


### Features

* evaluation v2 ([#36](https://github.com/amplitude/experiment-node-server/issues/36)) ([5443a7a](https://github.com/amplitude/experiment-node-server/commit/5443a7a95cea956502e1722673b473591ed0d82b))





## [1.7.8](https://github.com/amplitude/experiment-node-server/compare/v1.7.7...v1.7.8) (2023-10-26)


### Bug Fixes

* update analytics node sdk version ([03b7617](https://github.com/amplitude/experiment-node-server/commit/03b76171ad771d71f8f03719809404fd3550d302))





## [1.7.7](https://github.com/amplitude/experiment-node-server/compare/v1.7.6...v1.7.7) (2023-10-25)


### Bug Fixes

* AmplitudeCookie should use relative imports ([#35](https://github.com/amplitude/experiment-node-server/issues/35)) ([e473e84](https://github.com/amplitude/experiment-node-server/commit/e473e849bda63e4ff58fb35961830a0373c5f772))





## [1.7.6](https://github.com/amplitude/experiment-node-server/compare/v1.7.5...v1.7.6) (2023-10-23)

**Note:** Version bump only for package experiment-node-server-root





## [1.7.5](https://github.com/amplitude/experiment-node-server/compare/v1.7.4...v1.7.5) (2023-10-02)


### Bug Fixes

* update evaluation package to pick up version fix ([#32](https://github.com/amplitude/experiment-node-server/issues/32)) ([d91d0cd](https://github.com/amplitude/experiment-node-server/commit/d91d0cd0a4bf6fceed9ccb6746b17963b9a19712))





## [1.7.4](https://github.com/amplitude/experiment-node-server/compare/v1.7.3...v1.7.4) (2023-09-19)


### Bug Fixes

* don't track empty assignment events ([#31](https://github.com/amplitude/experiment-node-server/issues/31)) ([53f3506](https://github.com/amplitude/experiment-node-server/commit/53f35068af55c09cb5b34f6cf0a013b79ef8c3c6))





## [1.7.3](https://github.com/amplitude/experiment-node-server/compare/v1.7.2...v1.7.3) (2023-08-24)


### Bug Fixes

* Auto assignment tracking insert_id timestamp round to integer ([#30](https://github.com/amplitude/experiment-node-server/issues/30)) ([e1710f1](https://github.com/amplitude/experiment-node-server/commit/e1710f1d98317a1c34702db69b20f2d3cec79f49))





## [1.7.2](https://github.com/amplitude/experiment-node-server/compare/v1.7.1...v1.7.2) (2023-08-14)


### Bug Fixes

* Assignment should use relative imports ([#28](https://github.com/amplitude/experiment-node-server/issues/28)) ([bdb9703](https://github.com/amplitude/experiment-node-server/commit/bdb9703abe0252719760ed732f37329746167c15))





## [1.7.1](https://github.com/amplitude/experiment-node-server/compare/v1.7.0...v1.7.1) (2023-08-09)

**Note:** Version bump only for package experiment-node-server-root





# [1.7.0](https://github.com/amplitude/experiment-node-server/compare/v1.6.0...v1.7.0) (2023-08-08)


### Features

* Auto-assignment tracking ([#22](https://github.com/amplitude/experiment-node-server/issues/22)) ([6866739](https://github.com/amplitude/experiment-node-server/commit/686673918957f1653fe96f1fba6e3feb99629a4a))





# [1.6.0](https://github.com/amplitude/experiment-node-server/compare/v1.5.0...v1.6.0) (2023-07-19)


### Features

* add fetch options with flag keys option ([#23](https://github.com/amplitude/experiment-node-server/issues/23)) ([0d9d901](https://github.com/amplitude/experiment-node-server/commit/0d9d90115b2a16c991514e7487a3e2e41c6c9fa1))





# [1.5.0](https://github.com/amplitude/experiment-node-server/compare/v1.4.0...v1.5.0) (2023-07-10)


### Features

* support groups and group properties on skylab user ([#20](https://github.com/amplitude/experiment-node-server/issues/20)) ([7624e1d](https://github.com/amplitude/experiment-node-server/commit/7624e1deaf2c6e981610418f994478d794cdeaa9))





# [1.4.0](https://github.com/amplitude/experiment-node-server/compare/v1.3.0...v1.4.0) (2023-03-14)


### Bug Fixes

* flag dependencies; tests ([#14](https://github.com/amplitude/experiment-node-server/issues/14)) ([8ae0118](https://github.com/amplitude/experiment-node-server/commit/8ae01186c0ada351f008e3d17e827cc9de787570))


### Features

* flag dependencies ([#13](https://github.com/amplitude/experiment-node-server/issues/13)) ([9f8081e](https://github.com/amplitude/experiment-node-server/commit/9f8081eb37a77e9083016c82b5415b8088629ed4))





# [1.3.0](https://github.com/amplitude/experiment-node-server/compare/v1.2.1...v1.3.0) (2023-02-13)


### Bug Fixes

* use get instead of post ([#12](https://github.com/amplitude/experiment-node-server/issues/12)) ([62074c0](https://github.com/amplitude/experiment-node-server/commit/62074c0142b36c78d159dd7993ca4f7d4657c7a6))


### Features

* use socket timeout as default timeout ([#11](https://github.com/amplitude/experiment-node-server/issues/11)) ([3b86c3d](https://github.com/amplitude/experiment-node-server/commit/3b86c3d9a680ed462f57a79aa1f4c2ccc5418dc1))





## [1.2.1](https://github.com/amplitude/experiment-node-server/compare/v1.2.0...v1.2.1) (2022-10-05)


### Bug Fixes

* catch and log error from flag config poller request ([#10](https://github.com/amplitude/experiment-node-server/issues/10)) ([6e6b051](https://github.com/amplitude/experiment-node-server/commit/6e6b05105de7be197472584bd5a0635e9e001e06))





# [1.2.0](https://github.com/amplitude/experiment-node-server/compare/v1.1.1...v1.2.0) (2022-09-09)


### Features

* add local evaluation library header ([#8](https://github.com/amplitude/experiment-node-server/issues/8)) ([098b1b8](https://github.com/amplitude/experiment-node-server/commit/098b1b8dd1037e207bac7d3586a67c7a1bf3e134))





## [1.1.1](https://github.com/amplitude/experiment-node-server/compare/v1.1.0...v1.1.1) (2022-09-01)


### Bug Fixes

* move performance to test utils ([#7](https://github.com/amplitude/experiment-node-server/issues/7)) ([2608b6b](https://github.com/amplitude/experiment-node-server/commit/2608b6b43a9c1dd668cc414e05540f14c858d891))





# [1.1.0](https://github.com/amplitude/experiment-node-server/compare/v1.0.3...v1.1.0) (2022-08-01)


### Bug Fixes

* update evaluation dep ([d9efda4](https://github.com/amplitude/experiment-node-server/commit/d9efda4ee2ad4d4b4ef02d72a7fdaac9f43f1c1a))


### Features

* evaluation-js v1.0.0 ([b86f94e](https://github.com/amplitude/experiment-node-server/commit/b86f94e17ec9cca83b4189f0102aa11c01cb5cb2))
* local evaluation ([#6](https://github.com/amplitude/experiment-node-server/issues/6)) ([6be8686](https://github.com/amplitude/experiment-node-server/commit/6be868689ac03c8ee49841e43c21dc51f1b4c1c5))





## [1.0.3](https://github.com/amplitude/experiment-node-server/compare/v1.0.2...v1.0.3) (2022-05-02)


### Bug Fixes

* fix test case ([bb990df](https://github.com/amplitude/experiment-node-server/commit/bb990df488552277cda006d95b82ad059a50a59d))
* reuse connections ([#5](https://github.com/amplitude/experiment-node-server/issues/5)) ([13d897c](https://github.com/amplitude/experiment-node-server/commit/13d897c9dfe4049329e3dee9217af370170f8209))





## [1.0.2](https://github.com/amplitude/experiment-node-server/compare/v1.0.1...v1.0.2) (2021-10-21)


### Bug Fixes

* send library in fetch ([4df8047](https://github.com/amplitude/experiment-node-server/commit/4df804741f5b7f125f0717bca18b449595e24d3a))





## [1.0.1](https://github.com/amplitude/experiment-node-server/compare/v1.0.0...v1.0.1) (2021-07-16)


### Bug Fixes

* use POST to fetch ([#1](https://github.com/amplitude/experiment-node-server/issues/1)) ([1ebf601](https://github.com/amplitude/experiment-node-server/commit/1ebf6013a831de2172bcf398f60ebc7fb6f25bd8))
