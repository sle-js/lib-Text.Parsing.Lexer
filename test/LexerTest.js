const Assertion = mrequire("core:Test.Unit.Assertion:2.0.1");
const Maybe = mrequire("core:Native.Data.Maybe:1.0.0");
const Unit = mrequire("core:Test.Unit:1.0.0");

const Int = mrequire("core:Native.Data.Int:1.0.0");
const Regex = mrequire("core:Native.Data.String.Regex:1.0.0");


const Lexer = require("../index");


const lexerDefinition = Lexer.setup({
    eof: {id: 0, value: ""},
    err: text => ({id: -1, value: text}),
    whitespacePattern: Maybe.Just(Regex.from(/\s+/iy)),
    tokenPatterns: [
        [Regex.from(/[0-9]+/iy), text => ({id: 1, value: Int.fromString(text).withDefault(0)})],
        [Regex.from(/[a-z_][A-Za-z0-9_]*/y), text => ({id: 2, value: text})],
        [Regex.from(/[A-Z][A-Za-z0-9_]*/y), text => ({id: 3, value: text})],
    ],
    comments: [
        {open: Regex.from(/\/\//my), close: Regex.from(/\n/my), nested: false}
    ]
});


module.exports = Unit.Suite("Lexer Suite")([
    Unit.Test("given an empty lexer should be at EOF")(assertLexerState(
        Assertion,
        lexerDefinition.fromString(""),
        0, "", [1, 1, 1, 1], 0)
    ),

    Unit.Test("given an empty lexer should be at EOF after multiple attempts")((() => {
        const lexer =
            lexerDefinition.fromString("");
        const assertion1 = assertLexerState(
            Assertion,
            lexer,
            0, "", [1, 1, 1, 1], 0);
        const assertion2 = assertLexerState(
            assertion1,
            lexer.drop(1),
            0, "", [1, 1, 1, 1], 0);
        return assertLexerState(
            assertion2,
            lexer.drop(2),
            0, "", [1, 1, 1, 1], 0);
    })()),

    Unit.Test("given a lexer with a defined token should return that token")(assertLexerState(
        Assertion,
        lexerDefinition.fromString("2912 hello"),
        1, 2912, [1, 1, 4, 1], 0)
    ),

    Unit.Test("given a lexer with a defined token should return that token and the next token whilst skipping whitespace")((() => {
        const lexer =
            lexerDefinition.fromString("2912 hello");

        const assertion1 = assertLexerState(
            Assertion,
            lexer,
            1, 2912, [1, 1, 4, 1], 0);

        return assertLexerState(
            assertion1,
            lexer.drop(1),
            2, "hello", [6, 1, 10, 1], 5);
    })()),

    Unit.Test("given a lexer with a defined token should be able to discriminate between lower case IDs and upper case IDs")((() => {
        const lexer =
            lexerDefinition.fromString("hello Hello");

        const assertion1 = assertLexerState(
            Assertion,
            lexer,
            2, "hello", [1, 1, 5, 1], 0);

        return assertLexerState(
            assertion1,
            lexer.drop(1),
            3, "Hello", [7, 1, 11, 1], 6);
    })()),

    Unit.Test("given a lexer with a character that the lexer does not recognise then the error token is returned and the lexer is advanced onto the next character")((() => {
        lexer = lexerDefinition.fromString("2912*hello");

        const assertion1 = assertLexerState(
            Assertion,
            lexer,
            1, 2912, [1, 1, 4, 1], 0);

        const assertion2 = assertLexerState(
            assertion1,
            lexer.drop(1),
            -1, "*", [5, 1, 5, 1], 4);

        return assertLexerState(
            assertion2,
            lexer.drop(2),
            2, "hello", [6, 1, 10, 1], 5);
    })()),


    Unit.Test("given a lexer with an input of only whitespace")(
        assertLexerState(
            Assertion,
            lexerDefinition.fromString("   "),
            0, "", [4, 1, 4, 1], 3)
    ),

    Unit.Test("given a lexer with input contain non-nested comments should ignore the comments")((() => {
        const lexer =
            lexerDefinition.fromString("123\n// some comments\nabc");

        const assertion1 = assertLexerState(
            Assertion,
            lexer,
            1, 123, [1, 1, 3, 1], 0);

        return assertLexerState(
            assertion1,
            lexer.drop(1),
            2, "abc", [1, 3, 3, 3], 21);

    })())
]);


function assertLexerState(assertion, lexer, id, value, position, index) {
    const head = lexer.head();

    return assertion
        .equals(head.token().id)(id)
        .equals(head.token().value)(value)
        .equals(head.position()[0])(position[0])
        .equals(head.position()[1])(position[1])
        .equals(head.position()[2])(position[2])
        .equals(head.position()[3])(position[3])
        .equals(head.index())(index);
}
