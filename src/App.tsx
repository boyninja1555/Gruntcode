import { useState, useEffect } from "react"
import Editor, { useMonaco } from "@monaco-editor/react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faGithub, faYoutubeSquare } from "@fortawesome/free-brands-svg-icons"
import { faGlobe, faGraduationCap } from "@fortawesome/free-solid-svg-icons"

const EXTENSION_TO_LANGUAGE_MAP: Record<string, string> = {
	cs: "csharp",
	css: "css",
	gmoney: "gmoney",
	html: "html",
	java: "java",
	js: "javascript",
	txt: "plain",
	ts: "typescript",
}

function saveFile(
	code: string,
	ext: string,
	isDownloading: boolean,
	setIsDownloading: React.Dispatch<React.SetStateAction<boolean>>
) {
	if (!isDownloading) {
		setIsDownloading(true)

		const blob = new Blob([code], { type: "text/plain" })
		const url = URL.createObjectURL(blob)
		const downloadLink = document.createElement("a")
		downloadLink.href = url
		downloadLink.download = `gruntcode-save-${Math.floor(
			Math.random() * 1000000000
		)}.${ext}`

		document.body.appendChild(downloadLink)
		downloadLink.click()
		document.body.removeChild(downloadLink)
		URL.revokeObjectURL(url)

		setTimeout(() => setIsDownloading(false), 5000)
	}
}

function uploadFile(
	setCode: React.Dispatch<React.SetStateAction<string>>,
	extension: string,
	setExtension: React.Dispatch<React.SetStateAction<string>>,
	isUploading: boolean,
	setIsUploading: React.Dispatch<React.SetStateAction<boolean>>
) {
	if (!isUploading) {
		setIsUploading(true)

		const input = document.createElement("input")
		input.type = "file"
		input.accept = `.${extension}`

		input.onchange = async (event: Event) => {
			const file = (event.target as HTMLInputElement).files?.[0]

			if (file) {
				const reader = new FileReader()
				reader.onload = (e) => {
					const content = e.target?.result as string
					const ext = file.name.split(".").pop() || "txt"

					setCode(content)
					setExtension(ext)
				}
				reader.readAsText(file)
			}

			setIsUploading(false)
		}

		input.click()
	}
}

export default function App() {
	const initialExtension =
		new URLSearchParams(window.location.search).get("lang") || "txt"
	const initialMonacoLanguage =
		EXTENSION_TO_LANGUAGE_MAP[initialExtension] || initialExtension

	const [extension, setExtension] = useState(initialExtension)
	const [monacoLanguage, setMonacoLanguage] = useState(initialMonacoLanguage)
	const [code, setCode] = useState("")
	const [isDownloading, setIsDownloading] = useState(false)
	const [isUploading, setIsUploading] = useState(false)
	const monaco = useMonaco()

	useEffect(() => {
		setMonacoLanguage(EXTENSION_TO_LANGUAGE_MAP[extension] || extension)
	}, [extension])

	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const urlExt = params.get("lang") || "txt"
		setExtension(urlExt)
	}, [window.location.search])

	useEffect(() => {
		const fetchData = async () => {
			const res = await fetch(`/example/boilerplate.${extension}.txt`)
			const data = await res.text()
			setCode(data)
		}
		fetchData()
	}, [extension])

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.ctrlKey) {
				if (event.key === "s") {
					event.preventDefault()
					saveFile(code, extension, isDownloading, setIsDownloading)
				}
			}
		}

		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [code, extension, isDownloading, isUploading])

	useEffect(() => {
		if (monaco) {
			monaco.editor.defineTheme("gruntcode-dark", {
				base: "vs-dark",
				inherit: true,
				rules: [
					{ token: "comment", fontStyle: "italic", foreground: "aaaaaa" },
					{ token: "keyword", fontStyle: "bold", foreground: "22aaff" },
					{ token: "string", fontStyle: "underline", foreground: "88aa88" },
				],
				colors: {
					"editor.background": "#181818",
					"editor.foreground": "#efefef",
					"editorCursor.foreground": "#dfdfdf",
					"editor.lineHighlightBackground": "#313244",
				},
			})
			monaco.editor.setTheme("gruntcode-dark")

			// GMONEY language setup
			monaco.languages.register({ id: "gmoney" })
			monaco.languages.setLanguageConfiguration("gmoney", {
				comments: {
					lineComment: ";",
					blockComment: [";;;-", "-;;;"],
				},
				brackets: [
					["{", "}"],
					["[", "]"],
					["(", ")"],
				],
				autoClosingPairs: [
					{ open: "{", close: "}" },
					{ open: "[", close: "]" },
					{ open: "(", close: ")" },
					{ open: "\"", close: "\"" },
				],
				surroundingPairs: [
					{ open: "{", close: "}" },
					{ open: "[", close: "]" },
					{ open: "(", close: ")" },
					{ open: "\"", close: "\"" },
				],
			})
			monaco.languages.setMonarchTokensProvider("gmoney", {
				defaultToken: "",
				tokenPostfix: ".gmoney",
				keywords: ["id", "filedefine", "sub"],
				typeKeywords: ["string", "number", "boolean"],
				operators: /[=><!]=?|&&|\|\||\+\+|--|\+|\-|\*|\/|%/,
				escapes: /\\(?:[abfnrtv\\"0-7xuU]|x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
				tokenizer: {
					root: [
						[/[a-z_$][\w$]*/, {
							cases: {
								"@keywords": "keyword",
								"@typeKeywords": "type",
								"@default": "identifier",
							},
						}],
						{ include: "@whitespace" },
						[/[\{\}\(\)\[\]]/, "@brackets"],
						[/@operators/, "operator"],
						[/\d+/, "number"],
						[/"([^"\\]|\\.)*$/, "string.invalid"],
						[/"/, "string", "@string"],
						[/\/\/.*$/, "comment"],
						[/\/\*/, "comment", "@comment"],
					],
					comment: [
						[/[^/*]+/, "comment"],
						[/\*\//, "comment", "@pop"],
						[/[\/*]/, "comment"],
					],
					string: [
						[/[^\\"]+/, "string"],
						[/@escapes/, "string.escape"],
						[/\\./, "string.escape.invalid"],
						[/"/, "string", "@pop"],
					],
					whitespace: [
						[/[ \t\r\n]+/, ""],
						[/\/\*/, "comment", "@comment"],
						[/\/\/.*$/, "comment"],
					],
				},
			})
		}
	}, [monaco])

	return (
		<>
			<div
				id="sidebar"
				className="flex flex-col items-center px-[15px] bg-2 border-r-[1px] border-[#ccc] w-[256px] h-screen top-0 left-0 fixed"
			>
				<a href="#" className="flex items-center gap-[10px] my-[15px] text-2xl h-[50px]">
					<img src="/android-chrome-512x512.png" alt="Logo" className="h-full" />
					<span>Gruntcode</span>
				</a>

				<div className="flex flex-col w-full">
					<ul>
						<b className="uppercase">Languages</b>
						<hr className="my-[5px]" />

						<li><a href="/?lang=txt">Text</a></li>
						<li><a href="/?lang=cs">C#</a></li>
						<li><a href="/?lang=gmoney">Gmoney</a></li>
						<li><a href="/?lang=java">Java</a></li>
						<li><a href="/?lang=js">JavaScript</a></li>
						<li><a href="/?lang=ts">TypeScript</a></li>
						<li><a href="/?lang=html">html</a></li>
						<li><a href="/?lang=css">css</a></li>
					</ul>
					<ul className="mt-[25px]">
						<b className="uppercase">LINKS</b>
						<hr className="my-[5px]" />

						<li>
							<a href="https://tutorials-gcode.flappygrant.com" target="_blank" className="flex items-center gap-[5px]">
								<FontAwesomeIcon icon={faGraduationCap} />
								Gruntcode Tutorials
							</a>
						</li>
						<li>
							<a href="https://www.github.com/boyninja1555/Gruntcode" target="_blank" className="flex items-center gap-[5px]">
								<FontAwesomeIcon icon={faGithub} />
								Gruntcode GitHub
							</a>
						</li>
						<li>
							<a href="https://www.youtube.com/@FloorMann" target="_blank" className="flex items-center gap-[5px]">
								<FontAwesomeIcon icon={faYoutubeSquare} />
								Project Owner's YouTube
							</a>
						</li>
						<li>
							<a href="https://www.flappygrant.com" target="_blank" className="flex items-center gap-[5px]">
								<FontAwesomeIcon icon={faGlobe} />
								Project Owner's Website
							</a>
						</li>
					</ul>
				</div>
			</div>

			<div className="overflow-y-hidden">
				<section id="code-editor" className="ml-[256px]">
					<ul
						id="actions-list"
						className="flex bg-2 border-b-[1px] border-[#ccc] w-full h-[32px]"
					>
						<li>
							<button className="px-[25px] bg-1 border-r-[1px] border-[#ccc] h-full cursor-pointer" onClick={() => saveFile(code, extension, isDownloading, setIsDownloading)}>
								Save (CTRL+S)
							</button>
						</li>
						<li>
							<button className="px-[25px] bg-1 border-r-[1px] border-[#ccc] h-full cursor-pointer" onClick={() => uploadFile(setCode, extension, setExtension, isUploading, setIsUploading)}>
								Upload (No Keybind)
							</button>
						</li>
					</ul>

					<Editor
						language={monacoLanguage}
						value={code}
						theme="gruntcode-dark"
						onChange={(value) => setCode(value || "")}
						options={{
							tabSize: 4,
							fontFamily: "Roboto",
						}}
					/>
				</section>

				<section id="runner" className="ml-[256px] p-[25px]">
					<h3>Runner feature in development!</h3>
					<hr className="my-[15px]" />
					<p>For now, just input the code into a separate runner.</p>
				</section>
			</div>
		</>
	)
}
