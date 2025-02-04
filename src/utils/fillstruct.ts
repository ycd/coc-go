import { TextDocument, TextEdit } from 'vscode-languageserver-textdocument'
import { Position, window, workspace } from 'coc.nvim'
import { execTool } from './tools'
import { FILLSTRUCT, GOPLAY } from '../binaries'
import { URI } from 'vscode-uri'


export async function fillStruct(document: TextDocument): Promise<void> {
    const fileName = URI.parse(document.uri).fsPath
    let args = []
    let cursor = await window.getCursorPosition()

    args.push(
        "-file", fileName,
        "-line", cursor.line ,
    )

    const input = fileArchive(fileName, document.getText())
    const edit = await execFillStruct(args, input)

    await workspace.applyEdit({ changes: { [document.uri]: [edit] } })
}

// Interface for the output from fillstruct
interface FillStructOutput {
    start: number
    end: number
    code: string
}

async function execFillStruct(args: string[], input: string): Promise<TextEdit> {
    try {
        const stdout = await execTool(FILLSTRUCT, args, input)
        const fsout = JSON.parse(stdout) as FillStructOutput
        return {
            range: {
                start: { line: fsout.start - 1, character: 0 },
                end: { line: fsout.end, character: 0 }
            },
            newText: fsout.code + "\n"
        }

    } catch (err) {
        window.showMessage(`${err}`, "error")
        throw err
    }
}

function fileArchive(fileName: string, fileContents: string): string {
    return fileName + '\n' + Buffer.byteLength(fileContents, 'utf8') + '\n' + fileContents
}

// https://github.com/golang/vscode-go/blob/master/src/util.ts#L84
function byteOffsetAt(document: TextDocument, position: Position): string {
    const offset = document.offsetAt(position)
    const text = document.getText()
    return Buffer.byteLength(text.substr(0, offset)).toString()
}
