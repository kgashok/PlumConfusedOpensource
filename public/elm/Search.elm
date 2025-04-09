
module Search exposing (main)

import Browser
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Http
import Json.Decode as Decode exposing (Decoder)

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
    }

type Msg
    = UpdateQuery String
    | Search
    | GotTweets (Result Http.Error (List Tweet))

init : () -> (Model, Cmd Msg)
init _ =
    ( { query = "", tweets = [], error = Nothing }
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
    Http.get
        { url = "/api/search?q=" ++ query
        , expect = Http.expectJson GotTweets (Decode.list tweetDecoder)
        }

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
    case msg of
        UpdateQuery newQuery ->
            ( { model | query = newQuery }, Cmd.none )

        Search ->
            ( model, searchTweets model.query )

        GotTweets (Ok tweets) ->
            ( { model | tweets = tweets, error = Nothing }, Cmd.none )

        GotTweets (Err _) ->
            ( { model | error = Just "Failed to fetch tweets" }, Cmd.none )

view : Model -> Html Msg
view model =
    div [ class "search-container" ]
        [ div [ class "search-box" ]
            [ input 
                [ type_ "text"
                , placeholder "Search tweets..."
                , value model.query
                , onInput UpdateQuery
                , class "search-input"
                ] []
            , button [ onClick Search, class "search-button" ] [ text "Search" ]
            ]
        , viewResults model
        ]

viewResults : Model -> Html Msg
viewResults model =
    case model.error of
        Just error ->
            div [ class "error" ] [ text error ]
        
        Nothing ->
            div [ class "results" ] 
                (List.map viewTweet model.tweets)

viewTweet : Tweet -> Html Msg
viewTweet tweet =
    div [ class "tweet" ]
        [ div [ class "tweet-header" ]
            [ a [ href ("https://twitter.com/" ++ tweet.screenName), target "_blank" ]
                [ text ("@" ++ tweet.screenName) ]
            ]
        , div [ class "tweet-text" ] [ text tweet.text ]
        , div [ class "tweet-footer" ]
            [ a [ href tweet.url, target "_blank" ] [ text "View Tweet" ]
            , span [ class "timestamp" ] [ text tweet.timestamp ]
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
