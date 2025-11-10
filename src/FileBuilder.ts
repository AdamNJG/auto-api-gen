export default class FileBuilder {
  private file: string;

  private constructor (initialInput: string) {
    this.file = initialInput;
  }

  public static buildFile (initialInput: string = '') : FileBuilder {
    return new FileBuilder(initialInput);
  }

  public addLine (input: string) : FileBuilder {
    this.file = this.file + input + '\n';
    return this;
  }
  
  public addLines (input: string[]): FileBuilder {
    input.forEach(s => this.file = this.file + s + '\n');
    return this;
  }
 
  public addEmptyLine () : FileBuilder {
    this.file = this.file + '\n';
    return this;
  }

  public getFile () : string {
    return this.file;
  }
}