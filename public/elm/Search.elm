module Search exposing (Model, Msg, Tweet, main, view)

import Browser
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Http
import Json.Decode as Decode exposing (Decoder)
import Process
import Task


type alias Tweet =
    { id : String
    , text : String
    , timestamp : String
    , url : String
    , userId : String
    , screenName : String
    }


type alias Model =
    { query : String
    , tweets : List Tweet
    , error : Maybe String
    , searchId : Int
    , isSearching : Bool
    }


type Msg
    = UpdateQuery String
    | Search
    | Clear
    | GotTweets (Result Http.Error (List Tweet))
    | PerformSearch Int
    | DelayedSearch


init : () -> ( Model, Cmd Msg )
init _ =
    ( { query = ""
      , tweets = []
      , error = Nothing
      , searchId = 0
      , isSearching = False
      }
    , Cmd.none
    )


tweetDecoder : Decoder Tweet
tweetDecoder =
    Decode.map6 Tweet
        (Decode.field "id" Decode.string)
        (Decode.field "text" Decode.string)
        (Decode.field "timestamp" Decode.string)
        (Decode.field "url" Decode.string)
        (Decode.field "user_id" Decode.string)
        (Decode.field "screen_name" Decode.string)


searchTweets : String -> Cmd Msg
searchTweets query =
    if String.trim query == "" then
        Cmd.none

    else
        Http.get
            { url = "/api/search?q=" ++ query
            , expect =
                Http.expectJson GotTweets (Decode.list tweetDecoder)
            }


debounceDelay : Float
debounceDelay =
    300


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        UpdateQuery newQuery ->
            let
                newSearchId =
                    model.searchId + 1

                trimmedQuery =
                    String.trim newQuery
            in
            if trimmedQuery == "" then
                ( { model
                    | query = newQuery
                    , tweets = []
                    , error = Nothing
                    , searchId = newSearchId
                    , isSearching = False
                  }
                , Cmd.none
                )

            else
                ( { model
                    | query = newQuery
                    , searchId = newSearchId
                    , isSearching = True
                  }
                , Task.perform
                    (\_ -> PerformSearch newSearchId)
                    (Process.sleep debounceDelay)
                )

        PerformSearch searchId ->
            if searchId == model.searchId then
                ( model, searchTweets model.query )

            else
                ( model, Cmd.none )

        Search ->
            ( { model | isSearching = True }, searchTweets model.query )

        Clear ->
            ( { model
                | query = ""
                , tweets = []
                , error = Nothing
                , searchId = model.searchId + 1
                , isSearching = False
              }
            , Cmd.none
            )

        GotTweets (Ok tweets) ->
            ( { model
                | tweets = tweets
                , error = Nothing
                , isSearching = False
              }
            , Cmd.none
            )

        GotTweets (Err _) ->
            ( { model
                | error = Just "Failed to fetch tweets"
                , isSearching = False
              }
            , Cmd.none
            )

        DelayedSearch ->
            ( model, searchTweets model.query )


view : Model -> Html Msg
view model =
    div [ class "search-container" ]
        [ div [ class "search-bar" ]
            [ div [ class "search-input-wrapper" ]
                [ input
                    [ type_ "text"
                    , placeholder "Search tweets (live search enabled)..."
                    , value model.query
                    , onInput UpdateQuery
                    , class "search-input"
                    ]
                    []
                , if model.isSearching then
                    div [ class "search-spinner-wrap" ]
                        [ div [ class "spinner" ] []
                        ]

                  else
                    text ""
                ]
            , div [ class "search-actions" ]
                [ button
                    [ onClick Search
                    , class "btn-search"
                    , disabled model.isSearching
                    ]
                    [ text "Search" ]
                , button
                    [ onClick Clear
                    , class "btn-clear"
                    ]
                    [ text "Clear" ]
                ]
            ]
        , viewResults model
        ]


viewResults : Model -> Html Msg
viewResults model =
    case model.error of
        Just error ->
            div [ class "search-error" ] [ text error ]

        Nothing ->
            if model.isSearching && List.isEmpty model.tweets then
                div [ class "search-empty" ]
                    [ div [ class "search-loading" ]
                        [ div [ class "spinner" ] []
                        , text "Searching..."
                        ]
                    ]

            else if
                String.trim model.query
                    /= ""
                    && List.isEmpty model.tweets
                    && not model.isSearching
            then
                div [ class "search-empty" ]
                    [ text "No tweets found for your search." ]

            else
                div [ class "tweet-list" ]
                    (List.map viewTweet model.tweets)


viewTweet : Tweet -> Html Msg
viewTweet tweet =
    div [ class "tweet-card" ]
        [ div [ class "tweet-header" ]
            [ a
                [ href ("https://twitter.com/" ++ tweet.screenName)
                , target "_blank"
                , class "author-link"
                ]
                [ text ("@" ++ tweet.screenName) ]
            ]
        , div [ class "tweet-body" ] [ text tweet.text ]
        , div [ class "tweet-footer" ]
            [ a
                [ href tweet.url
                , target "_blank"
                , class "view-tweet-btn"
                ]
                [ text "View Tweet" ]
            , span [ class "tweet-timestamp" ] [ text tweet.timestamp ]
            ]
        ]


main : Program () Model Msg
main =
    Browser.element
        { init = init
        , update = update
        , view = view
        , subscriptions = \_ -> Sub.none
        }
