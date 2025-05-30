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

  it('should preserve the original class name', async () => {
    expect(instance.constructor.name).toEqual('TestClass');
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

  it('should preserve the original method name', async () => {
    expect(instance.method.name).toEqual('method');
  });
});
