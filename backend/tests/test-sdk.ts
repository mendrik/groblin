import type { ExecutionResult } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Addresses = {
  City?: Maybe<Scalars['String']['output']>;
  Country?: Maybe<Scalars['String']['output']>;
  Phones?: Maybe<Phones>;
  Street?: Maybe<Scalars['String']['output']>;
  Zipcode?: Maybe<Scalars['String']['output']>;
};

export type AddressesFilter = {
  City?: InputMaybe<Scalars['String']['input']>;
  City_not?: InputMaybe<Scalars['String']['input']>;
  City_rex?: InputMaybe<Scalars['String']['input']>;
  Country?: InputMaybe<Scalars['String']['input']>;
  Country_not?: InputMaybe<Scalars['String']['input']>;
  Country_rex?: InputMaybe<Scalars['String']['input']>;
  Home?: InputMaybe<Scalars['String']['input']>;
  Home_not?: InputMaybe<Scalars['String']['input']>;
  Home_rex?: InputMaybe<Scalars['String']['input']>;
  Mobile?: InputMaybe<Scalars['String']['input']>;
  Mobile_not?: InputMaybe<Scalars['String']['input']>;
  Mobile_rex?: InputMaybe<Scalars['String']['input']>;
  Street?: InputMaybe<Scalars['String']['input']>;
  Street_not?: InputMaybe<Scalars['String']['input']>;
  Street_rex?: InputMaybe<Scalars['String']['input']>;
  Zipcode?: InputMaybe<Scalars['String']['input']>;
  Zipcode_not?: InputMaybe<Scalars['String']['input']>;
  Zipcode_rex?: InputMaybe<Scalars['String']['input']>;
};

export enum AddressesOrder {
  City = 'City',
  Country = 'Country',
  Home = 'Home',
  Mobile = 'Mobile',
  Street = 'Street',
  Zipcode = 'Zipcode'
}

export type DateInput = {
  day?: InputMaybe<Scalars['Int']['input']>;
  month?: InputMaybe<Scalars['Int']['input']>;
  year?: InputMaybe<Scalars['Int']['input']>;
};

export enum Direction {
  Asc = 'asc',
  Desc = 'desc'
}

export type Environment = {
  article?: Maybe<Scalars['String']['output']>;
  color?: Maybe<Array<Maybe<Scalars['Int']['output']>>>;
  image?: Maybe<Media_Image>;
  url?: Maybe<Scalars['String']['output']>;
};

export type EnvironmentFilter = {
  article_rex?: InputMaybe<Scalars['String']['input']>;
  color?: InputMaybe<Scalars['String']['input']>;
  color_not?: InputMaybe<Scalars['String']['input']>;
  image_not?: InputMaybe<Scalars['Boolean']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
  url_not?: InputMaybe<Scalars['String']['input']>;
  url_rex?: InputMaybe<Scalars['String']['input']>;
};

export enum EnvironmentOrder {
  Article = 'article',
  Color = 'color',
  Image = 'image',
  Url = 'url'
}

export enum Gender {
  Female = 'Female',
  Male = 'Male'
}

export type Media_Image = {
  contentType?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
  url_600?: Maybe<Scalars['String']['output']>;
};

export type People = {
  Age?: Maybe<Scalars['Float']['output']>;
  Birthdate?: Maybe<Scalars['String']['output']>;
  Clothing?: Maybe<Array<Maybe<Scalars['Int']['output']>>>;
  Gender?: Maybe<Gender>;
  Management?: Maybe<Scalars['Boolean']['output']>;
  Name?: Maybe<Scalars['String']['output']>;
};

export type PeopleFilter = {
  Age?: InputMaybe<Scalars['Float']['input']>;
  Age_gt?: InputMaybe<Scalars['Float']['input']>;
  Age_gte?: InputMaybe<Scalars['Float']['input']>;
  Age_lt?: InputMaybe<Scalars['Float']['input']>;
  Age_lte?: InputMaybe<Scalars['Float']['input']>;
  Age_not?: InputMaybe<Scalars['Float']['input']>;
  Birthdate?: InputMaybe<DateInput>;
  Birthdate_gt?: InputMaybe<DateInput>;
  Birthdate_gte?: InputMaybe<DateInput>;
  Birthdate_lt?: InputMaybe<DateInput>;
  Birthdate_lte?: InputMaybe<DateInput>;
  Birthdate_not?: InputMaybe<DateInput>;
  Clothing?: InputMaybe<Scalars['String']['input']>;
  Clothing_not?: InputMaybe<Scalars['String']['input']>;
  Gender?: InputMaybe<Gender>;
  Gender_not?: InputMaybe<Gender>;
  Management?: InputMaybe<Scalars['Boolean']['input']>;
  Name?: InputMaybe<Scalars['String']['input']>;
  Name_not?: InputMaybe<Scalars['String']['input']>;
  Name_rex?: InputMaybe<Scalars['String']['input']>;
};

export enum PeopleOrder {
  Age = 'Age',
  Birthdate = 'Birthdate',
  Clothing = 'Clothing',
  Gender = 'Gender',
  Management = 'Management',
  Name = 'Name'
}

export type Phones = {
  Home?: Maybe<Scalars['String']['output']>;
  Mobile?: Maybe<Scalars['String']['output']>;
};

export type Root = {
  Addresses?: Maybe<Array<Maybe<Addresses>>>;
  Environment?: Maybe<Array<Maybe<Environment>>>;
  People?: Maybe<Array<Maybe<People>>>;
};


export type RootAddressesArgs = {
  direction?: InputMaybe<Direction>;
  filter?: InputMaybe<Array<InputMaybe<AddressesFilter>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<AddressesOrder>;
};


export type RootEnvironmentArgs = {
  direction?: InputMaybe<Direction>;
  filter?: InputMaybe<Array<InputMaybe<EnvironmentFilter>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<EnvironmentOrder>;
};


export type RootPeopleArgs = {
  direction?: InputMaybe<Direction>;
  filter?: InputMaybe<Array<InputMaybe<PeopleFilter>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<PeopleOrder>;
};

export type FetchPeopleQueryVariables = Exact<{ [key: string]: never; }>;


export type FetchPeopleQuery = { People?: Array<{ Name?: string | null, Age?: number | null, Birthdate?: string | null, Clothing?: Array<number | null> | null, Gender?: Gender | null, Management?: boolean | null } | null> | null };

export type FetchFilteredQueryVariables = Exact<{
  filter?: InputMaybe<Array<InputMaybe<PeopleFilter>> | InputMaybe<PeopleFilter>>;
  order?: InputMaybe<PeopleOrder>;
}>;


export type FetchFilteredQuery = { People?: Array<{ Name?: string | null } | null> | null };


export const FetchPeopleDocument = `
    query fetchPeople {
  People {
    Name
    Age
    Birthdate
    Clothing
    Gender
    Management
  }
}
    `;
export const FetchFilteredDocument = `
    query fetchFiltered($filter: [PeopleFilter], $order: PeopleOrder) {
  People(filter: $filter, order: $order) {
    Name
  }
}
    `;
export type Requester<C = {}, E = unknown> = <R, V>(doc: string, vars?: V, options?: C) => Promise<ExecutionResult<R, E>> | AsyncIterable<ExecutionResult<R, E>>
export function getSdk<C, E>(requester: Requester<C, E>) {
  return {
    fetchPeople(variables?: FetchPeopleQueryVariables, options?: C): Promise<ExecutionResult<FetchPeopleQuery, E>> {
      return requester<FetchPeopleQuery, FetchPeopleQueryVariables>(FetchPeopleDocument, variables, options) as Promise<ExecutionResult<FetchPeopleQuery, E>>;
    },
    fetchFiltered(variables?: FetchFilteredQueryVariables, options?: C): Promise<ExecutionResult<FetchFilteredQuery, E>> {
      return requester<FetchFilteredQuery, FetchFilteredQueryVariables>(FetchFilteredDocument, variables, options) as Promise<ExecutionResult<FetchFilteredQuery, E>>;
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;