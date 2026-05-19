declare namespace NodeJS {
  export interface ProcessEnv {}
}

declare module "*.md" {
  const content: string;
  export default content;
}
