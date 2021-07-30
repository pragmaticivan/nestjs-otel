declare type Param = {
    name?: string;
    setStatus?: boolean;
};
export declare function Span(param?: Param): (target: any, propertyKey: string, propertyDescriptor: PropertyDescriptor) => void;
export {};
