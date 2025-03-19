/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
declare module "@accordproject/markdown-common";
declare module "@accordproject/markdown-template";
declare module "@accordproject/markdown-transform";
// declare module "html2pdf.js" {
//   const html2pdf: any; // Or define more specific types if you know them
//   export default html2pdf;
// }

declare module "html2pdf.js" {
  interface Html2PdfInterface {
    set: (options: any) => Html2PdfInterface;
    from: (element: HTMLElement) => Html2PdfInterface;
    save: () => Promise<void>;
  }
  export default function (): Html2PdfInterface;
}
