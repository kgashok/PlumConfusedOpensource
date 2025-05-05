module SearchTest exposing (suite)

import Expect
import Test exposing (..)
import Search exposing (Model, view)
import Html.Attributes as Attr
import Test.Html.Query as Query
import Test.Html.Selector as Selector

suite : Test
suite =
    describe "Search module"
        [ describe "view"
            [ test "buttons are visible on mobile viewport" <|
                \_ ->
                    let
                        model : Model
                        model =
                            { query = ""
                            , tweets = []
                            , error = Nothing
                            }
                    in
                    view model
                        |> Query.fromHtml
                        |> Query.findAll [ Selector.tag "button" ]
                        |> Query.count (Expect.equal 2)
            ]
        ]