import {Children,type ReactNode,type ComponentPropsWithoutRef} from 'react';

// CHANGE: Column count follows visible cards, so disabled optional content cannot leave a reserved column.
export function PublicCardGrid({children,maxColumns=3,className='',...props}:{children:ReactNode;maxColumns?:2|3|4}&ComponentPropsWithoutRef<'div'>) {
  const count=Children.toArray(children).filter(Boolean).length;
  const columns=count<2?'grid-cols-1 mx-auto w-full max-w-3xl':count===2||maxColumns===2?'grid-cols-1 md:grid-cols-2':count===3||maxColumns===3?'grid-cols-1 md:grid-cols-2 lg:grid-cols-3':'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  return <div {...props} className={`grid gap-6 ${columns} ${className}`} data-card-count={count}>{children}</div>;
}
