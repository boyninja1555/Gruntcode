import { useState, useEffect } from "react"
import Editor, { useMonaco } from "@monaco-editor/react"

export default function App() {
	const [language, setLanguage] = useState(new URLSearchParams(location.search).get("lang") || "txt")
	const [code, setCode] = useState("")
	const [isDownloading, setIsDownloading] = useState(false)
	const monaco = useMonaco()

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.ctrlKey && event.key === "s") {
				event.preventDefault()

				if (!isDownloading) {
					setIsDownloading(true)

					const blob = new Blob([code], { type: language })
					const url = URL.createObjectURL(blob)
					const downloadLink = document.createElement("a")
					downloadLink.href = url
					downloadLink.download = `gruntcode-save-${Math.floor(Math.random() * 1000000000 - 1)}.${language}`

					document.body.appendChild(downloadLink)
					downloadLink.click()
					document.body.removeChild(downloadLink)
					URL.revokeObjectURL(url)

					setTimeout(() => setIsDownloading(false), 5000)
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown)

		return () => {
			window.removeEventListener("keydown", handleKeyDown)
		}
	}, [code, language, isDownloading])

	useEffect(() => {
		setLanguage(new URLSearchParams(location.search).get("lang") || "txt")
	}, [location.search])

	useEffect(() => {
		const fetchData = async () => {
			const getBoilerplate = async (language: string) => {
				const res = await fetch(`/example/App.${language}.txt`)
				const dat = await res.text()
				return dat
			}
			setCode(await getBoilerplate(language))
		}
		fetchData()
	}, [language])

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

			// GMONEY language
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

				keywords: [
					"id", "filedefine", "sub",
				],

				typeKeywords: [
					"string", "number", "boolean",
				],

				operators: /[=><!]=?|&&|\|\||\+\+|--|\+|\-|\*|\/|%/,

				escapes: /\\(?:[abfnrtv\\"'0-7xuU]|x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

				tokenizer: {
					root: [
						// Identifiers and keywords
						[/[a-z_$][\w$]*/, {
							cases: {
								"@keywords": "keyword",
								"@typeKeywords": "type",
								"@default": "identifier"
							}
						}],

						// Whitespace
						{ include: "@whitespace" },

						// Delimiters and operators
						[/[\{\}\(\)\[\]]/, "@brackets"],
						[/@operators/, "operator"],

						// Numbers
						[/\d+/, "number"],

						// Strings
						[/"([^"\\]|\\.)*$/, "string.invalid"],
						[/"/, "string", "@string"],

						// Comments
						[/\/\/.*$/, "comment"],
						[/\/\*/, "comment", "@comment"]
					],

					comment: [
						[/[^/*]+/, "comment"],
						[/\*\//, "comment", "@pop"],
						[/[\/*]/, "comment"]
					],

					string: [
						[/[^\\"]+/, "string"],
						[/@escapes/, "string.escape"],
						[/\\./, "string.escape.invalid"],
						[/"/, "string", "@pop"]
					],

					whitespace: [
						[/[ \t\r\n]+/, ""],
						[/\/\*/, "comment", "@comment"],
						[/\/\/.*$/, "comment"]
					]
				}
			})
		}
	}, [monaco])

	return (
		<>
			<div id="sidebar" className="flex flex-col items-center px-[15px] bg-2 w-[256px] h-screen top-0 left-0 fixed">
				<a href="#" className="flex items-center gap-[10px] my-[15px] text-2xl h-[50px]">
					<img src="/android-chrome-512x512.png" alt="Logo" className="h-full" />
					<span>Gruntcode</span>
				</a>

				<div className="flex flex-col w-full">
					<b className="uppercase">Languages</b>
					<hr className="my-[5px]" />

					<a href="?lang=txt">Text</a>
					<a href="?lang=csharp">C#</a>
					<a href="?lang=gmoney">Gmoney</a>
					<a href="?lang=java">Java</a>
					<a href="?lang=javascript">JavaScript</a>
					<a href="?lang=typescript">TypeScript</a>



					<b className="uppercase mt-[50px]">Pages</b>
					<hr className="my-[5px]" />

					<a href="/#code-editor">Code Editor</a>
					<a href="/#runner">Runner</a>
				</div>
			</div>

			<div className="overflow-y-hidden">
				<section id="code-editor" className="ml-[256px]">
					<Editor
						defaultLanguage={language}
						defaultValue={code}
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

					<p>For now, just input the code into a seperate runner.</p>
				</section>
			</div>
		</>
	)
}
