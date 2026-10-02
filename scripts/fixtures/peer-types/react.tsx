import { Button } from "mtrl/react";

export const ok = <Button disabled={false} onChange={(event) => { const value: string = event.detail.value; void value; }} />;

// @ts-expect-error disabled is a boolean
export const bad = <Button disabled={"no"} onChange={(event) => { const value: string = event.detail.value; void value; }} />;

// @ts-expect-error value is a string, not a number: fails if the payload collapsed to any
export const payload = <Button onChange={(event) => { const value: number = event.detail.value; void value; }} />;
