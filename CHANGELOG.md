# Changelog

### [3.0.4](https://www.github.com/pragmaticivan/nestjs-otel/compare/v3.0.3...v3.0.4) (2022-03-29)


### Bug Fixes

* **metrics:** make sure metadata is kept ([de7ca0f](https://www.github.com/pragmaticivan/nestjs-otel/commit/de7ca0f387dbe44142c58c827ccd777348ae491b))
* **tracing:** make sure metadata is kept ([c34ae56](https://www.github.com/pragmaticivan/nestjs-otel/commit/c34ae561e73daea879f6871f2f781a565d03a95a))

### [3.0.3](https://www.github.com/pragmaticivan/nestjs-otel/compare/v3.0.2...v3.0.3) (2022-03-25)


### Bug Fixes

* **tracing:** record exception and set correct span status ([616c12b](https://www.github.com/pragmaticivan/nestjs-otel/commit/616c12b157f7736e9fd45cd38bf9a4c21c11e140))

### [3.0.2](https://www.github.com/pragmaticivan/nestjs-otel/compare/v3.0.1...v3.0.2) (2022-03-24)


### Bug Fixes

* **tracing:** use startActiveSpan to ensure span in correct context ([d608b84](https://www.github.com/pragmaticivan/nestjs-otel/commit/d608b84e582b41105c6871ee2e7174f7a0116d96))

### [3.0.1](https://www.github.com/pragmaticivan/nestjs-otel/compare/v3.0.0...v3.0.1) (2022-01-03)


### Bug Fixes

* **#171:** fixes missing observation callback for observable metrics ([7d89c1f](https://www.github.com/pragmaticivan/nestjs-otel/commit/7d89c1f910b28d0661da6f2989ddea4b9bdcc643)), closes [#171](https://www.github.com/pragmaticivan/nestjs-otel/issues/171)

## [3.0.0](https://www.github.com/pragmaticivan/nestjs-otel/compare/v2.6.1...v3.0.0) (2021-12-30)


### ⚠ BREAKING CHANGES

* Anything related to metrics sdk has changed. OTEL now has a stable spec and all the projects are moving towards new interfaces.

### Features

* ename value recorder on decorators and update readme ([646e2ea](https://www.github.com/pragmaticivan/nestjs-otel/commit/646e2eacd07127f9658b302c09d3056b3b2e1771))
* support all metric types from otel spec ([36a7c5f](https://www.github.com/pragmaticivan/nestjs-otel/commit/36a7c5f2f895157b3e675a7a6ff6693fea6cc8f2))
* update metric spec to the latest otel lib ([6ed63ae](https://www.github.com/pragmaticivan/nestjs-otel/commit/6ed63aefbc1e39da9659d6e232a4883f7ed93dac))
* update packages to compply with latest otel metric spec ([943ca06](https://www.github.com/pragmaticivan/nestjs-otel/commit/943ca06ea62e95d8a07af63030609f226b78c4b8))

### [2.6.1](https://www.github.com/pragmaticivan/nestjs-otel/compare/v2.6.0...v2.6.1) (2021-10-13)


### Reverts

* replace arrow function back with unnamed function ([3e7ac1f](https://www.github.com/pragmaticivan/nestjs-otel/commit/3e7ac1f160e1454f7c36470aafd7e8bfa7ee47b5))

## [2.6.0](https://www.github.com/pragmaticivan/nestjs-otel/compare/v2.5.2...v2.6.0) (2021-10-12)


### Features

* **metrics:** option for ignoring undefined routes ([15577e8](https://www.github.com/pragmaticivan/nestjs-otel/commit/15577e83c7b3ea7642dc7eba65517361edfe3a54))
* **metrics:** option to ignore specific routes ([b8a05f1](https://www.github.com/pragmaticivan/nestjs-otel/commit/b8a05f1ef46b9e077f8c4edbad59f91b00d3a49e))


### Bug Fixes

* eslint setup ([14d9870](https://www.github.com/pragmaticivan/nestjs-otel/commit/14d9870d9aacee325a7338dd764ccfef404b7ad5))
* linting ([1961f18](https://www.github.com/pragmaticivan/nestjs-otel/commit/1961f18ae1203a4e721e72caeb9f425f1937d918))
* **linting:** replace unnamed function with arrow function ([12fa02c](https://www.github.com/pragmaticivan/nestjs-otel/commit/12fa02c081ef85ddde7208c7b865efcaa05bab6f))
* **metrics:** add missing commas in example config in README.md ([7b159c6](https://www.github.com/pragmaticivan/nestjs-otel/commit/7b159c603bc9655b270f9447414cdab473b31526))

### [2.5.2](https://www.github.com/pragmaticivan/nestjs-otel/compare/v2.5.1...v2.5.2) (2021-10-07)


### Bug Fixes

* enable nestjs 7.x as peer dependency ([e6c6a1e](https://www.github.com/pragmaticivan/nestjs-otel/commit/e6c6a1e9dd2ae0f906dea2775faaf7a51daeb755))

### [2.5.1](https://www.github.com/pragmaticivan/nestjs-otel/compare/v2.5.0...v2.5.1) (2021-10-06)


### Bug Fixes

* metrics for fastify platform ([4b61e70](https://www.github.com/pragmaticivan/nestjs-otel/commit/4b61e7079d5470088b92d459e7923e4460dd606c))

## [2.5.0](https://www.github.com/pragmaticivan/nestjs-otel/compare/v2.4.0...v2.5.0) (2021-09-26)


### Features

* add defaultLabels support ([6efb0a5](https://www.github.com/pragmaticivan/nestjs-otel/commit/6efb0a540546bd78d0ea582e949beb3c77be3288))

## [2.4.0](https://www.github.com/pragmaticivan/nestjs-otel/compare/v2.3.0...v2.4.0) (2021-08-24)


### Features

* add http size and server abort metrics ([ba64308](https://www.github.com/pragmaticivan/nestjs-otel/commit/ba64308e7c986cddceed06f2248476c66747f4c6))

## [2.3.0](https://www.github.com/pragmaticivan/nestjs-otel/compare/v2.2.0...v2.3.0) (2021-08-13)


### Features

* update peer dependency to allow support for both v7 and v8 of NestJs ([647eb89](https://www.github.com/pragmaticivan/nestjs-otel/commit/647eb8906675414a05d14640c2374be1e8837f0e))


### Bug Fixes

* error nodeMetrics is not a function ([cf7d0fc](https://www.github.com/pragmaticivan/nestjs-otel/commit/cf7d0fc2e0d728470b5b259932bfad4be8f6aa3c))
* removed .npmrc file, as it only had default values ([c27a8af](https://www.github.com/pragmaticivan/nestjs-otel/commit/c27a8af8d757ec67113158a3ee466adca32c9b04))
* updates package-lock.json with default node 14 np version ([3301753](https://www.github.com/pragmaticivan/nestjs-otel/commit/330175321fc58e1ce269061101a537a3f0cc45bf))

## [2.2.0](https://www.github.com/pragmaticivan/nestjs-otel/compare/v2.1.0...v2.2.0) (2021-08-02)


### Features

* update dependencies to latest ([385e3db](https://www.github.com/pragmaticivan/nestjs-otel/commit/385e3db485633257a498e25005086bf5b60331ac))

## [2.1.0](https://www.github.com/pragmaticivan/nestjs-otel/compare/v2.0.0...v2.1.0) (2021-07-28)


### Features

* add metric decorators ([9263bd0](https://www.github.com/pragmaticivan/nestjs-otel/commit/9263bd0844e203920375ca04a4876fe60e8ea2a7))

## [2.0.0](https://www.github.com/pragmaticivan/nestjs-otel/compare/v1.8.2...v2.0.0) (2021-07-28)


### ⚠ BREAKING CHANGES

* removes nodeSDKConfiguration option

### Features

* node-sdk to be defined by the user instead of through the lib ([5156324](https://www.github.com/pragmaticivan/nestjs-otel/commit/5156324b64cee8fccd2d06eaf5d155e22a5c0fbf))

### [1.8.2](https://www.github.com/pragmaticivan/nestjs-otel/compare/v1.8.1...v1.8.2) (2021-07-25)


### Bug Fixes

* **metric:** fixes metric service not properly reusing existing metrics ([9f24fd8](https://www.github.com/pragmaticivan/nestjs-otel/commit/9f24fd8a76e6ee0060468de1326265c1fb7b4824))

### [1.8.1](https://www.github.com/pragmaticivan/nestjs-otel/compare/v1.8.0...v1.8.1) (2021-07-25)


### Bug Fixes

* **middleware:** fixes api middleware when no requesting invalid route ([2a008d9](https://www.github.com/pragmaticivan/nestjs-otel/commit/2a008d9ab605a1660c0e5015bd7d635813e3fc57))

## [1.8.0](https://www.github.com/pragmaticivan/nestjs-otel/compare/v1.7.0...v1.8.0) (2021-07-24)


### Features

* update api metrics to use route match path instead of full route ([ad51bac](https://www.github.com/pragmaticivan/nestjs-otel/commit/ad51bac1b0121257434cc4543853227669f15aca)), closes [#48](https://www.github.com/pragmaticivan/nestjs-otel/issues/48)


### Bug Fixes

* fixes forRootAsync usage ([a390f0e](https://www.github.com/pragmaticivan/nestjs-otel/commit/a390f0e564227b5e9019d1b8da19e4966e3d7ddf))

## [1.7.0](https://www.github.com/pragmaticivan/nestjs-otel/compare/v1.6.0...v1.7.0) (2021-07-14)


### Features

* remove unused constant and reorganize pkgs ([d37fc28](https://www.github.com/pragmaticivan/nestjs-otel/commit/d37fc28c7bc3944399cda157a6ee87a5b83919e3))

## [1.6.0](https://www.github.com/pragmaticivan/nestjs-otel/compare/v1.5.0...v1.6.0) (2021-06-30)


### Features

* changes license to Apache2 ([5129fdb](https://www.github.com/pragmaticivan/nestjs-otel/commit/5129fdba49a834437faddda20044afd3d91ea7a7))

## [1.5.0](https://www.github.com/pragmaticivan/nestjs-otel/compare/v1.4.0...v1.5.0) (2021-06-30)


### Features

* support forRootAsync ([8cb00a4](https://www.github.com/pragmaticivan/nestjs-otel/commit/8cb00a455e65e1de9b893291720c037b29a847aa))

## [1.4.0](https://www.github.com/pragmaticivan/nestjs-otel/compare/v1.3.0...v1.4.0) (2021-06-29)


### Features

* removes prometheus Interface and use metrics instead ([f3fd29e](https://www.github.com/pragmaticivan/nestjs-otel/commit/f3fd29eab94cb6ab4302d7990d25a3bcc3250f56))
* sets meter provider globally on sdk ([4be57ef](https://www.github.com/pragmaticivan/nestjs-otel/commit/4be57ef02eeff516ef5b7ceb88731e2de570f553))

## [1.3.0](https://www.github.com/pragmaticivan/nestjs-otel/compare/v1.2.3...v1.3.0) (2021-06-28)


### Features

* improves api metrics middleware ([df50305](https://www.github.com/pragmaticivan/nestjs-otel/commit/df503056087f1c128fe4999fbb77f8b45a6a1a74))

### [1.2.3](https://www.github.com/pragmaticivan/nestjs-otel/compare/v1.2.2...v1.2.3) (2021-06-27)


### Bug Fixes

* properly ignore /metrics path on middleware ([45973a4](https://www.github.com/pragmaticivan/nestjs-otel/commit/45973a4abd8270acc789aeecfe93a8b05f98b30a))

### [1.2.2](https://www.github.com/pragmaticivan/nestjs-otel/compare/v1.2.1...v1.2.2) (2021-06-27)


### Bug Fixes

* resolve problems with conditional dependency and default configs and add jest config ([1f1fb12](https://www.github.com/pragmaticivan/nestjs-otel/commit/1f1fb12dcc2df42f2f3082031f31248c246128c1))

### [1.2.1](https://www.github.com/pragmaticivan/nestjs-otel/compare/v1.2.0...v1.2.1) (2021-06-25)


### Bug Fixes

* exports MetricService on core module ([e8096a6](https://www.github.com/pragmaticivan/nestjs-otel/commit/e8096a65a262a1213e3f7117b74f657b812fbed0))

## [1.2.0](https://www.github.com/pragmaticivan/nestjs-otel/compare/v1.1.0...v1.2.0) (2021-06-25)


### Features

* export MetricService ([6ed93ae](https://www.github.com/pragmaticivan/nestjs-otel/commit/6ed93ae526dec7ed1c7f4eacb043c2df7168fc70))

## [1.1.0](https://www.github.com/pragmaticivan/nestjs-otel/compare/v1.0.0...v1.1.0) (2021-06-25)


### Features

* use lts npm match for 14.x ([9088eac](https://www.github.com/pragmaticivan/nestjs-otel/commit/9088eac2308e8d3320353ff5da7587fb45ae7657))


### Bug Fixes

* removes latest npm requirement ([9dd42f8](https://www.github.com/pragmaticivan/nestjs-otel/commit/9dd42f85e8fc309967f66e8619de265fa0e9bfdb))

## 1.0.0 (2021-06-25)


### Features

* first commit ([0c07ff5](https://www.github.com/pragmaticivan/nestjs-otel/commit/0c07ff52bd4df8b04f8951c67cb88f96f5f31957))
