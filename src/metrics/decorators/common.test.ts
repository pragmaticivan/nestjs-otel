import 'reflect-metadata';
import { SetMetadata } from '@nestjs/common';
import { OtelInstanceCounter, OtelMethodCounter } from './common';

const TestDecoratorThatSetsMetadata = () => SetMetadata('some-metadata', true);

@OtelInstanceCounter()
@TestDecoratorThatSetsMetadata()
class TestClass {
  @TestDecoratorThatSetsMetadata()
  @OtelMethodCounter()
  method() {}
}

describe('OtelInstanceCounter', () => {
  let instance: TestClass;

  beforeEach(() => {
    instance = new TestClass();
  });

  it('should maintain reflect metadata', async () => {
    expect(Reflect.getMetadata('some-metadata', instance.constructor)).toEqual(true);
  });
});

describe('OtelMethodCounter', () => {
  let instance: TestClass;

  beforeEach(() => {
    instance = new TestClass();
  });

  it('should maintain reflect metadata', async () => {
    expect(Reflect.getMetadata('some-metadata', instance.method)).toEqual(true);
  });
});
