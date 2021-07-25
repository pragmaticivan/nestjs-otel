# Changelog

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
