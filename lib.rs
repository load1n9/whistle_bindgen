use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::wasm_bindgen;
use wasm_bindgen::JsValue;
use whistle_ast::Expr;
use whistle_ast::Grammar;
use whistle_ast::IdentType;
use whistle_ast::IdentTyped;
use whistle_ast::ProgramStmt;
use whistle_common::TokenItem;
use whistle_compiler::compile_grammar;
use whistle_compiler::Compiler;
use whistle_compiler::CompilerError;
use whistle_lexer::*;
use whistle_parser::*;

#[derive(Debug)]
enum InternalError {
  Lexer(LexerError),
  Parser(ParserError),
  Compiler(Vec<CompilerError>),
}

fn lex_internal(text: &str) -> Result<Vec<TokenItem>, InternalError> {
  let lexer = Lexer::new(text);
  lexer
    .map(|item| item.map_err(InternalError::Lexer))
    .collect()
}

fn parse_internal(text: &str) -> Result<Grammar, InternalError> {
  let tokens = lex_internal(text)?;
  let parser = &mut Parser::new(tokens);
  parse_all(parser).map_err(InternalError::Parser)
}

fn compile_internal(text: &str) -> Result<Vec<u8>, InternalError> {
  let grammar = parse_internal(text)?;
  let compiler = &mut Compiler::new();
  compile_grammar(compiler, grammar).map_err(InternalError::Compiler)
}

#[wasm_bindgen]
pub fn lex(text: &str) -> Result<String, String> {
  lex_internal(text)
    .map(|ok| format!("{:#?}", ok))
    .map_err(|err| format!("{:#?}", err))
}

#[derive(Serialize, Deserialize)]
pub struct ExportFunction {
  export: bool,
  inline: bool,
  ident: String,
  params: Vec<String>,
  ret_type: String,
}

#[derive(Serialize, Deserialize)]
pub struct ExportVariable {
  ident_typed: String,
  val: String,
}
fn compile_fn(
  export: bool,
  inline: bool,
  ident: String,
  params: Vec<IdentTyped>,
  ret_type: IdentType,
) -> JsValue {
  let params_format = params.into_iter().map(|ok| format!("{:?}", ok.type_ident)).collect();

  let fun = ExportFunction {
    export,
    inline,
    ident,
    params: params_format,
    ret_type: format!("{:?}", ret_type),
  };
  serde_wasm_bindgen::to_value(&fun).ok().unwrap()
}

fn compile_var(ident_typed: IdentTyped, val: Expr) -> JsValue {
  let var = ExportVariable {
    ident_typed: format!("{:?}", ident_typed),
    val: format!("{:?}", val),
  };
  serde_wasm_bindgen::to_value(&var).ok().unwrap()
}

fn compile_null() -> JsValue {
  serde_wasm_bindgen::to_value(&true).ok().unwrap()
}
fn to_json(vec: Vec<ProgramStmt>) -> Vec<JsValue> {
  let mut vector: Vec<JsValue> = Vec::new();
  for tok in vec {
    let test = match tok {
      ProgramStmt::FunctionDecl {
        export,
        inline,
        ident,
        params,
        ret_type,
        stmt: _,
      } => compile_fn(export, inline, ident, params, ret_type),
      ProgramStmt::ValDecl { ident_typed, val } => compile_var(ident_typed, val),
      ProgramStmt::VarDecl { ident_typed, val } => compile_var(ident_typed, val),
      __=> compile_null(),
    };
    vector.push(test);
  }
  vector
}

#[wasm_bindgen]
pub fn parse_exports(text: &str) -> Vec<JsValue> {
  let result = parse_internal(text)
  .map(|ok| to_json(ok))
  .map_err(|err| format!("{:#?}", err)).ok().unwrap();
  result
}

#[wasm_bindgen]
pub fn compile(text: &str) -> Result<Vec<u8>, String> {
  compile_internal(text).map_err(|err| format!("{:#?}", err))
}
