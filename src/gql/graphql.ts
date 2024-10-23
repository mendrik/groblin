/* eslint-disable */
import { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
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
  bigint: { input: any; output: any; }
};

/** Boolean expression to compare columns of type "Int". All fields are combined with logical 'AND'. */
export type Int_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['Int']['input']>;
  _gt?: InputMaybe<Scalars['Int']['input']>;
  _gte?: InputMaybe<Scalars['Int']['input']>;
  _in?: InputMaybe<Array<Scalars['Int']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['Int']['input']>;
  _lte?: InputMaybe<Scalars['Int']['input']>;
  _neq?: InputMaybe<Scalars['Int']['input']>;
  _nin?: InputMaybe<Array<Scalars['Int']['input']>>;
};

/** Boolean expression to compare columns of type "String". All fields are combined with logical 'AND'. */
export type String_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['String']['input']>;
  _gt?: InputMaybe<Scalars['String']['input']>;
  _gte?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given case-insensitive pattern */
  _ilike?: InputMaybe<Scalars['String']['input']>;
  _in?: InputMaybe<Array<Scalars['String']['input']>>;
  /** does the column match the given POSIX regular expression, case insensitive */
  _iregex?: InputMaybe<Scalars['String']['input']>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  /** does the column match the given pattern */
  _like?: InputMaybe<Scalars['String']['input']>;
  _lt?: InputMaybe<Scalars['String']['input']>;
  _lte?: InputMaybe<Scalars['String']['input']>;
  _neq?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given case-insensitive pattern */
  _nilike?: InputMaybe<Scalars['String']['input']>;
  _nin?: InputMaybe<Array<Scalars['String']['input']>>;
  /** does the column NOT match the given POSIX regular expression, case insensitive */
  _niregex?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given pattern */
  _nlike?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given POSIX regular expression, case sensitive */
  _nregex?: InputMaybe<Scalars['String']['input']>;
  /** does the column NOT match the given SQL regular expression */
  _nsimilar?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given POSIX regular expression, case sensitive */
  _regex?: InputMaybe<Scalars['String']['input']>;
  /** does the column match the given SQL regular expression */
  _similar?: InputMaybe<Scalars['String']['input']>;
};

/** Boolean expression to compare columns of type "bigint". All fields are combined with logical 'AND'. */
export type Bigint_Comparison_Exp = {
  _eq?: InputMaybe<Scalars['bigint']['input']>;
  _gt?: InputMaybe<Scalars['bigint']['input']>;
  _gte?: InputMaybe<Scalars['bigint']['input']>;
  _in?: InputMaybe<Array<Scalars['bigint']['input']>>;
  _is_null?: InputMaybe<Scalars['Boolean']['input']>;
  _lt?: InputMaybe<Scalars['bigint']['input']>;
  _lte?: InputMaybe<Scalars['bigint']['input']>;
  _neq?: InputMaybe<Scalars['bigint']['input']>;
  _nin?: InputMaybe<Array<Scalars['bigint']['input']>>;
};

/** ordering argument of a cursor */
export enum Cursor_Ordering {
  /** ascending ordering of the cursor */
  Asc = 'ASC',
  /** descending ordering of the cursor */
  Desc = 'DESC'
}

export type Node_Aggregate_Bool_Exp = {
  count?: InputMaybe<Node_Aggregate_Bool_Exp_Count>;
};

export type Node_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Node_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Node_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** order by aggregate values of table "node" */
export type Node_Aggregate_Order_By = {
  avg?: InputMaybe<Node_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Node_Max_Order_By>;
  min?: InputMaybe<Node_Min_Order_By>;
  stddev?: InputMaybe<Node_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Node_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Node_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Node_Sum_Order_By>;
  var_pop?: InputMaybe<Node_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Node_Var_Samp_Order_By>;
  variance?: InputMaybe<Node_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "node" */
export type Node_Arr_Rel_Insert_Input = {
  data: Array<Node_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Node_On_Conflict>;
};

/** order by avg() on columns of table "node" */
export type Node_Avg_Order_By = {
  id?: InputMaybe<Order_By>;
  node_id?: InputMaybe<Order_By>;
  order?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "node". All fields are combined with a logical 'AND'. */
export type Node_Bool_Exp = {
  _and?: InputMaybe<Array<Node_Bool_Exp>>;
  _not?: InputMaybe<Node_Bool_Exp>;
  _or?: InputMaybe<Array<Node_Bool_Exp>>;
  id?: InputMaybe<Bigint_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  node?: InputMaybe<Node_Bool_Exp>;
  node_id?: InputMaybe<Bigint_Comparison_Exp>;
  nodes?: InputMaybe<Node_Bool_Exp>;
  nodes_aggregate?: InputMaybe<Node_Aggregate_Bool_Exp>;
  order?: InputMaybe<Int_Comparison_Exp>;
  type?: InputMaybe<String_Comparison_Exp>;
};

/** unique or primary key constraints on table "node" */
export enum Node_Constraint {
  /** unique or primary key constraint on columns "id" */
  NodePkey = 'node_pkey'
}

/** input type for incrementing numeric columns in table "node" */
export type Node_Inc_Input = {
  id?: InputMaybe<Scalars['bigint']['input']>;
  node_id?: InputMaybe<Scalars['bigint']['input']>;
  order?: InputMaybe<Scalars['Int']['input']>;
};

/** input type for inserting data into table "node" */
export type Node_Insert_Input = {
  id?: InputMaybe<Scalars['bigint']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  node?: InputMaybe<Node_Obj_Rel_Insert_Input>;
  node_id?: InputMaybe<Scalars['bigint']['input']>;
  nodes?: InputMaybe<Node_Arr_Rel_Insert_Input>;
  order?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

/** order by max() on columns of table "node" */
export type Node_Max_Order_By = {
  id?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  node_id?: InputMaybe<Order_By>;
  order?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
};

/** order by min() on columns of table "node" */
export type Node_Min_Order_By = {
  id?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  node_id?: InputMaybe<Order_By>;
  order?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
};

/** input type for inserting object relation for remote table "node" */
export type Node_Obj_Rel_Insert_Input = {
  data: Node_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Node_On_Conflict>;
};

/** on_conflict condition type for table "node" */
export type Node_On_Conflict = {
  constraint: Node_Constraint;
  update_columns?: Array<Node_Update_Column>;
  where?: InputMaybe<Node_Bool_Exp>;
};

/** Ordering options when selecting data from "node". */
export type Node_Order_By = {
  id?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  node?: InputMaybe<Node_Order_By>;
  node_id?: InputMaybe<Order_By>;
  nodes_aggregate?: InputMaybe<Node_Aggregate_Order_By>;
  order?: InputMaybe<Order_By>;
  type?: InputMaybe<Order_By>;
};

/** primary key columns input for table: node */
export type Node_Pk_Columns_Input = {
  id: Scalars['bigint']['input'];
};

/** select columns of table "node" */
export enum Node_Select_Column {
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  NodeId = 'node_id',
  /** column name */
  Order = 'order',
  /** column name */
  Type = 'type'
}

/** input type for updating data in table "node" */
export type Node_Set_Input = {
  id?: InputMaybe<Scalars['bigint']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  node_id?: InputMaybe<Scalars['bigint']['input']>;
  order?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

/** order by stddev() on columns of table "node" */
export type Node_Stddev_Order_By = {
  id?: InputMaybe<Order_By>;
  node_id?: InputMaybe<Order_By>;
  order?: InputMaybe<Order_By>;
};

/** order by stddev_pop() on columns of table "node" */
export type Node_Stddev_Pop_Order_By = {
  id?: InputMaybe<Order_By>;
  node_id?: InputMaybe<Order_By>;
  order?: InputMaybe<Order_By>;
};

/** order by stddev_samp() on columns of table "node" */
export type Node_Stddev_Samp_Order_By = {
  id?: InputMaybe<Order_By>;
  node_id?: InputMaybe<Order_By>;
  order?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "node" */
export type Node_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Node_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Node_Stream_Cursor_Value_Input = {
  id?: InputMaybe<Scalars['bigint']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  node_id?: InputMaybe<Scalars['bigint']['input']>;
  order?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

/** order by sum() on columns of table "node" */
export type Node_Sum_Order_By = {
  id?: InputMaybe<Order_By>;
  node_id?: InputMaybe<Order_By>;
  order?: InputMaybe<Order_By>;
};

/** update columns of table "node" */
export enum Node_Update_Column {
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  NodeId = 'node_id',
  /** column name */
  Order = 'order',
  /** column name */
  Type = 'type'
}

export type Node_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Node_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Node_Set_Input>;
  /** filter the rows which have to be updated */
  where: Node_Bool_Exp;
};

/** order by var_pop() on columns of table "node" */
export type Node_Var_Pop_Order_By = {
  id?: InputMaybe<Order_By>;
  node_id?: InputMaybe<Order_By>;
  order?: InputMaybe<Order_By>;
};

/** order by var_samp() on columns of table "node" */
export type Node_Var_Samp_Order_By = {
  id?: InputMaybe<Order_By>;
  node_id?: InputMaybe<Order_By>;
  order?: InputMaybe<Order_By>;
};

/** order by variance() on columns of table "node" */
export type Node_Variance_Order_By = {
  id?: InputMaybe<Order_By>;
  node_id?: InputMaybe<Order_By>;
  order?: InputMaybe<Order_By>;
};

/** column ordering options */
export enum Order_By {
  /** in ascending order, nulls last */
  Asc = 'asc',
  /** in ascending order, nulls first */
  AscNullsFirst = 'asc_nulls_first',
  /** in ascending order, nulls last */
  AscNullsLast = 'asc_nulls_last',
  /** in descending order, nulls first */
  Desc = 'desc',
  /** in descending order, nulls first */
  DescNullsFirst = 'desc_nulls_first',
  /** in descending order, nulls last */
  DescNullsLast = 'desc_nulls_last'
}

/** Boolean expression to filter rows from the table "project". All fields are combined with a logical 'AND'. */
export type Project_Bool_Exp = {
  _and?: InputMaybe<Array<Project_Bool_Exp>>;
  _not?: InputMaybe<Project_Bool_Exp>;
  _or?: InputMaybe<Array<Project_Bool_Exp>>;
  id?: InputMaybe<Bigint_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  project_users?: InputMaybe<Project_User_Bool_Exp>;
  project_users_aggregate?: InputMaybe<Project_User_Aggregate_Bool_Exp>;
  tags?: InputMaybe<Tag_Bool_Exp>;
  tags_aggregate?: InputMaybe<Tag_Aggregate_Bool_Exp>;
};

/** unique or primary key constraints on table "project" */
export enum Project_Constraint {
  /** unique or primary key constraint on columns "id" */
  ProjectPkey = 'project_pkey'
}

/** input type for incrementing numeric columns in table "project" */
export type Project_Inc_Input = {
  id?: InputMaybe<Scalars['bigint']['input']>;
};

/** input type for inserting data into table "project" */
export type Project_Insert_Input = {
  id?: InputMaybe<Scalars['bigint']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  project_users?: InputMaybe<Project_User_Arr_Rel_Insert_Input>;
  tags?: InputMaybe<Tag_Arr_Rel_Insert_Input>;
};

/** input type for inserting object relation for remote table "project" */
export type Project_Obj_Rel_Insert_Input = {
  data: Project_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<Project_On_Conflict>;
};

/** on_conflict condition type for table "project" */
export type Project_On_Conflict = {
  constraint: Project_Constraint;
  update_columns?: Array<Project_Update_Column>;
  where?: InputMaybe<Project_Bool_Exp>;
};

/** Ordering options when selecting data from "project". */
export type Project_Order_By = {
  id?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  project_users_aggregate?: InputMaybe<Project_User_Aggregate_Order_By>;
  tags_aggregate?: InputMaybe<Tag_Aggregate_Order_By>;
};

/** primary key columns input for table: project */
export type Project_Pk_Columns_Input = {
  id: Scalars['bigint']['input'];
};

/** select columns of table "project" */
export enum Project_Select_Column {
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name'
}

/** input type for updating data in table "project" */
export type Project_Set_Input = {
  id?: InputMaybe<Scalars['bigint']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

/** Streaming cursor of the table "project" */
export type Project_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Project_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Project_Stream_Cursor_Value_Input = {
  id?: InputMaybe<Scalars['bigint']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

/** update columns of table "project" */
export enum Project_Update_Column {
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name'
}

export type Project_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Project_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Project_Set_Input>;
  /** filter the rows which have to be updated */
  where: Project_Bool_Exp;
};

export type Project_User_Aggregate_Bool_Exp = {
  count?: InputMaybe<Project_User_Aggregate_Bool_Exp_Count>;
};

export type Project_User_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Project_User_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Project_User_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** order by aggregate values of table "project_user" */
export type Project_User_Aggregate_Order_By = {
  avg?: InputMaybe<Project_User_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Project_User_Max_Order_By>;
  min?: InputMaybe<Project_User_Min_Order_By>;
  stddev?: InputMaybe<Project_User_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Project_User_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Project_User_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Project_User_Sum_Order_By>;
  var_pop?: InputMaybe<Project_User_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Project_User_Var_Samp_Order_By>;
  variance?: InputMaybe<Project_User_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "project_user" */
export type Project_User_Arr_Rel_Insert_Input = {
  data: Array<Project_User_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Project_User_On_Conflict>;
};

/** order by avg() on columns of table "project_user" */
export type Project_User_Avg_Order_By = {
  project_id?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "project_user". All fields are combined with a logical 'AND'. */
export type Project_User_Bool_Exp = {
  _and?: InputMaybe<Array<Project_User_Bool_Exp>>;
  _not?: InputMaybe<Project_User_Bool_Exp>;
  _or?: InputMaybe<Array<Project_User_Bool_Exp>>;
  project?: InputMaybe<Project_Bool_Exp>;
  project_id?: InputMaybe<Bigint_Comparison_Exp>;
  role?: InputMaybe<String_Comparison_Exp>;
  user?: InputMaybe<User_Bool_Exp>;
  user_id?: InputMaybe<Bigint_Comparison_Exp>;
};

/** unique or primary key constraints on table "project_user" */
export enum Project_User_Constraint {
  /** unique or primary key constraint on columns "project_id", "user_id" */
  ProjectUserPkey = 'project_user_pkey'
}

/** input type for incrementing numeric columns in table "project_user" */
export type Project_User_Inc_Input = {
  project_id?: InputMaybe<Scalars['bigint']['input']>;
  user_id?: InputMaybe<Scalars['bigint']['input']>;
};

/** input type for inserting data into table "project_user" */
export type Project_User_Insert_Input = {
  project?: InputMaybe<Project_Obj_Rel_Insert_Input>;
  project_id?: InputMaybe<Scalars['bigint']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
  user?: InputMaybe<User_Obj_Rel_Insert_Input>;
  user_id?: InputMaybe<Scalars['bigint']['input']>;
};

/** order by max() on columns of table "project_user" */
export type Project_User_Max_Order_By = {
  project_id?: InputMaybe<Order_By>;
  role?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** order by min() on columns of table "project_user" */
export type Project_User_Min_Order_By = {
  project_id?: InputMaybe<Order_By>;
  role?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** on_conflict condition type for table "project_user" */
export type Project_User_On_Conflict = {
  constraint: Project_User_Constraint;
  update_columns?: Array<Project_User_Update_Column>;
  where?: InputMaybe<Project_User_Bool_Exp>;
};

/** Ordering options when selecting data from "project_user". */
export type Project_User_Order_By = {
  project?: InputMaybe<Project_Order_By>;
  project_id?: InputMaybe<Order_By>;
  role?: InputMaybe<Order_By>;
  user?: InputMaybe<User_Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** primary key columns input for table: project_user */
export type Project_User_Pk_Columns_Input = {
  project_id: Scalars['bigint']['input'];
  user_id: Scalars['bigint']['input'];
};

/** select columns of table "project_user" */
export enum Project_User_Select_Column {
  /** column name */
  ProjectId = 'project_id',
  /** column name */
  Role = 'role',
  /** column name */
  UserId = 'user_id'
}

/** input type for updating data in table "project_user" */
export type Project_User_Set_Input = {
  project_id?: InputMaybe<Scalars['bigint']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['bigint']['input']>;
};

/** order by stddev() on columns of table "project_user" */
export type Project_User_Stddev_Order_By = {
  project_id?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** order by stddev_pop() on columns of table "project_user" */
export type Project_User_Stddev_Pop_Order_By = {
  project_id?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** order by stddev_samp() on columns of table "project_user" */
export type Project_User_Stddev_Samp_Order_By = {
  project_id?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "project_user" */
export type Project_User_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Project_User_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Project_User_Stream_Cursor_Value_Input = {
  project_id?: InputMaybe<Scalars['bigint']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['bigint']['input']>;
};

/** order by sum() on columns of table "project_user" */
export type Project_User_Sum_Order_By = {
  project_id?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** update columns of table "project_user" */
export enum Project_User_Update_Column {
  /** column name */
  ProjectId = 'project_id',
  /** column name */
  Role = 'role',
  /** column name */
  UserId = 'user_id'
}

export type Project_User_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Project_User_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Project_User_Set_Input>;
  /** filter the rows which have to be updated */
  where: Project_User_Bool_Exp;
};

/** order by var_pop() on columns of table "project_user" */
export type Project_User_Var_Pop_Order_By = {
  project_id?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** order by var_samp() on columns of table "project_user" */
export type Project_User_Var_Samp_Order_By = {
  project_id?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

/** order by variance() on columns of table "project_user" */
export type Project_User_Variance_Order_By = {
  project_id?: InputMaybe<Order_By>;
  user_id?: InputMaybe<Order_By>;
};

export type Tag_Aggregate_Bool_Exp = {
  count?: InputMaybe<Tag_Aggregate_Bool_Exp_Count>;
};

export type Tag_Aggregate_Bool_Exp_Count = {
  arguments?: InputMaybe<Array<Tag_Select_Column>>;
  distinct?: InputMaybe<Scalars['Boolean']['input']>;
  filter?: InputMaybe<Tag_Bool_Exp>;
  predicate: Int_Comparison_Exp;
};

/** order by aggregate values of table "tag" */
export type Tag_Aggregate_Order_By = {
  avg?: InputMaybe<Tag_Avg_Order_By>;
  count?: InputMaybe<Order_By>;
  max?: InputMaybe<Tag_Max_Order_By>;
  min?: InputMaybe<Tag_Min_Order_By>;
  stddev?: InputMaybe<Tag_Stddev_Order_By>;
  stddev_pop?: InputMaybe<Tag_Stddev_Pop_Order_By>;
  stddev_samp?: InputMaybe<Tag_Stddev_Samp_Order_By>;
  sum?: InputMaybe<Tag_Sum_Order_By>;
  var_pop?: InputMaybe<Tag_Var_Pop_Order_By>;
  var_samp?: InputMaybe<Tag_Var_Samp_Order_By>;
  variance?: InputMaybe<Tag_Variance_Order_By>;
};

/** input type for inserting array relation for remote table "tag" */
export type Tag_Arr_Rel_Insert_Input = {
  data: Array<Tag_Insert_Input>;
  /** upsert condition */
  on_conflict?: InputMaybe<Tag_On_Conflict>;
};

/** order by avg() on columns of table "tag" */
export type Tag_Avg_Order_By = {
  id?: InputMaybe<Order_By>;
  parent_tag?: InputMaybe<Order_By>;
  project_id?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "tag". All fields are combined with a logical 'AND'. */
export type Tag_Bool_Exp = {
  _and?: InputMaybe<Array<Tag_Bool_Exp>>;
  _not?: InputMaybe<Tag_Bool_Exp>;
  _or?: InputMaybe<Array<Tag_Bool_Exp>>;
  id?: InputMaybe<Bigint_Comparison_Exp>;
  name?: InputMaybe<String_Comparison_Exp>;
  parent_tag?: InputMaybe<Bigint_Comparison_Exp>;
  project?: InputMaybe<Project_Bool_Exp>;
  project_id?: InputMaybe<Bigint_Comparison_Exp>;
  tags?: InputMaybe<Tag_Bool_Exp>;
  tags_aggregate?: InputMaybe<Tag_Aggregate_Bool_Exp>;
};

/** unique or primary key constraints on table "tag" */
export enum Tag_Constraint {
  /** unique or primary key constraint on columns "id" */
  TagPkey = 'tag_pkey'
}

/** input type for incrementing numeric columns in table "tag" */
export type Tag_Inc_Input = {
  id?: InputMaybe<Scalars['bigint']['input']>;
  parent_tag?: InputMaybe<Scalars['bigint']['input']>;
  project_id?: InputMaybe<Scalars['bigint']['input']>;
};

/** input type for inserting data into table "tag" */
export type Tag_Insert_Input = {
  id?: InputMaybe<Scalars['bigint']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  parent_tag?: InputMaybe<Scalars['bigint']['input']>;
  project?: InputMaybe<Project_Obj_Rel_Insert_Input>;
  project_id?: InputMaybe<Scalars['bigint']['input']>;
  tags?: InputMaybe<Tag_Arr_Rel_Insert_Input>;
};

/** order by max() on columns of table "tag" */
export type Tag_Max_Order_By = {
  id?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  parent_tag?: InputMaybe<Order_By>;
  project_id?: InputMaybe<Order_By>;
};

/** order by min() on columns of table "tag" */
export type Tag_Min_Order_By = {
  id?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  parent_tag?: InputMaybe<Order_By>;
  project_id?: InputMaybe<Order_By>;
};

/** on_conflict condition type for table "tag" */
export type Tag_On_Conflict = {
  constraint: Tag_Constraint;
  update_columns?: Array<Tag_Update_Column>;
  where?: InputMaybe<Tag_Bool_Exp>;
};

/** Ordering options when selecting data from "tag". */
export type Tag_Order_By = {
  id?: InputMaybe<Order_By>;
  name?: InputMaybe<Order_By>;
  parent_tag?: InputMaybe<Order_By>;
  project?: InputMaybe<Project_Order_By>;
  project_id?: InputMaybe<Order_By>;
  tags_aggregate?: InputMaybe<Tag_Aggregate_Order_By>;
};

/** primary key columns input for table: tag */
export type Tag_Pk_Columns_Input = {
  id: Scalars['bigint']['input'];
};

/** select columns of table "tag" */
export enum Tag_Select_Column {
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  ParentTag = 'parent_tag',
  /** column name */
  ProjectId = 'project_id'
}

/** input type for updating data in table "tag" */
export type Tag_Set_Input = {
  id?: InputMaybe<Scalars['bigint']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  parent_tag?: InputMaybe<Scalars['bigint']['input']>;
  project_id?: InputMaybe<Scalars['bigint']['input']>;
};

/** order by stddev() on columns of table "tag" */
export type Tag_Stddev_Order_By = {
  id?: InputMaybe<Order_By>;
  parent_tag?: InputMaybe<Order_By>;
  project_id?: InputMaybe<Order_By>;
};

/** order by stddev_pop() on columns of table "tag" */
export type Tag_Stddev_Pop_Order_By = {
  id?: InputMaybe<Order_By>;
  parent_tag?: InputMaybe<Order_By>;
  project_id?: InputMaybe<Order_By>;
};

/** order by stddev_samp() on columns of table "tag" */
export type Tag_Stddev_Samp_Order_By = {
  id?: InputMaybe<Order_By>;
  parent_tag?: InputMaybe<Order_By>;
  project_id?: InputMaybe<Order_By>;
};

/** Streaming cursor of the table "tag" */
export type Tag_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: Tag_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type Tag_Stream_Cursor_Value_Input = {
  id?: InputMaybe<Scalars['bigint']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  parent_tag?: InputMaybe<Scalars['bigint']['input']>;
  project_id?: InputMaybe<Scalars['bigint']['input']>;
};

/** order by sum() on columns of table "tag" */
export type Tag_Sum_Order_By = {
  id?: InputMaybe<Order_By>;
  parent_tag?: InputMaybe<Order_By>;
  project_id?: InputMaybe<Order_By>;
};

/** update columns of table "tag" */
export enum Tag_Update_Column {
  /** column name */
  Id = 'id',
  /** column name */
  Name = 'name',
  /** column name */
  ParentTag = 'parent_tag',
  /** column name */
  ProjectId = 'project_id'
}

export type Tag_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<Tag_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<Tag_Set_Input>;
  /** filter the rows which have to be updated */
  where: Tag_Bool_Exp;
};

/** order by var_pop() on columns of table "tag" */
export type Tag_Var_Pop_Order_By = {
  id?: InputMaybe<Order_By>;
  parent_tag?: InputMaybe<Order_By>;
  project_id?: InputMaybe<Order_By>;
};

/** order by var_samp() on columns of table "tag" */
export type Tag_Var_Samp_Order_By = {
  id?: InputMaybe<Order_By>;
  parent_tag?: InputMaybe<Order_By>;
  project_id?: InputMaybe<Order_By>;
};

/** order by variance() on columns of table "tag" */
export type Tag_Variance_Order_By = {
  id?: InputMaybe<Order_By>;
  parent_tag?: InputMaybe<Order_By>;
  project_id?: InputMaybe<Order_By>;
};

/** Boolean expression to filter rows from the table "user". All fields are combined with a logical 'AND'. */
export type User_Bool_Exp = {
  _and?: InputMaybe<Array<User_Bool_Exp>>;
  _not?: InputMaybe<User_Bool_Exp>;
  _or?: InputMaybe<Array<User_Bool_Exp>>;
  email?: InputMaybe<String_Comparison_Exp>;
  id?: InputMaybe<Bigint_Comparison_Exp>;
  password?: InputMaybe<String_Comparison_Exp>;
  project_users?: InputMaybe<Project_User_Bool_Exp>;
  project_users_aggregate?: InputMaybe<Project_User_Aggregate_Bool_Exp>;
};

/** unique or primary key constraints on table "user" */
export enum User_Constraint {
  /** unique or primary key constraint on columns "id" */
  UserIndex_1 = 'user_index_1'
}

/** input type for incrementing numeric columns in table "user" */
export type User_Inc_Input = {
  id?: InputMaybe<Scalars['bigint']['input']>;
};

/** input type for inserting data into table "user" */
export type User_Insert_Input = {
  email?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['bigint']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  project_users?: InputMaybe<Project_User_Arr_Rel_Insert_Input>;
};

/** input type for inserting object relation for remote table "user" */
export type User_Obj_Rel_Insert_Input = {
  data: User_Insert_Input;
  /** upsert condition */
  on_conflict?: InputMaybe<User_On_Conflict>;
};

/** on_conflict condition type for table "user" */
export type User_On_Conflict = {
  constraint: User_Constraint;
  update_columns?: Array<User_Update_Column>;
  where?: InputMaybe<User_Bool_Exp>;
};

/** Ordering options when selecting data from "user". */
export type User_Order_By = {
  email?: InputMaybe<Order_By>;
  id?: InputMaybe<Order_By>;
  password?: InputMaybe<Order_By>;
  project_users_aggregate?: InputMaybe<Project_User_Aggregate_Order_By>;
};

/** select columns of table "user" */
export enum User_Select_Column {
  /** column name */
  Email = 'email',
  /** column name */
  Id = 'id',
  /** column name */
  Password = 'password'
}

/** input type for updating data in table "user" */
export type User_Set_Input = {
  email?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['bigint']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
};

/** Streaming cursor of the table "user" */
export type User_Stream_Cursor_Input = {
  /** Stream column input with initial value */
  initial_value: User_Stream_Cursor_Value_Input;
  /** cursor ordering */
  ordering?: InputMaybe<Cursor_Ordering>;
};

/** Initial value of the column from where the streaming should start */
export type User_Stream_Cursor_Value_Input = {
  email?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['bigint']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
};

/** update columns of table "user" */
export enum User_Update_Column {
  /** column name */
  Email = 'email',
  /** column name */
  Id = 'id',
  /** column name */
  Password = 'password'
}

export type User_Updates = {
  /** increments the numeric columns with given value of the filtered values */
  _inc?: InputMaybe<User_Inc_Input>;
  /** sets the columns of the filtered rows to the given values */
  _set?: InputMaybe<User_Set_Input>;
  /** filter the rows which have to be updated */
  where: User_Bool_Exp;
};

export type GetNodesSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type GetNodesSubscription = { __typename?: 'subscription_root', node: Array<{ __typename?: 'node', id: any, name: string, node_id?: any | null, type: string, order: number }> };

export type UpdateNodeNameMutationVariables = Exact<{
  id: Scalars['bigint']['input'];
  name: Scalars['String']['input'];
}>;


export type UpdateNodeNameMutation = { __typename?: 'mutation_root', update_node_by_pk?: { __typename?: 'node', id: any } | null };

export type DeleteNodeMutationVariables = Exact<{
  id: Scalars['bigint']['input'];
  parent_id: Scalars['bigint']['input'];
  order: Scalars['Int']['input'];
}>;


export type DeleteNodeMutation = { __typename?: 'mutation_root', delete_node_by_pk?: { __typename?: 'node', id: any } | null, update_node?: { __typename?: 'node_mutation_response', affected_rows: number } | null };

export type Insert_NodeMutationVariables = Exact<{
  object: Node_Insert_Input;
  parent_id: Scalars['bigint']['input'];
  order: Scalars['Int']['input'];
}>;


export type Insert_NodeMutation = { __typename?: 'mutation_root', update_node?: { __typename?: 'node_mutation_response', affected_rows: number } | null, insert_node_one?: { __typename?: 'node', id: any } | null };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: DocumentTypeDecoration<TResult, TVariables>['__apiType'];

  constructor(private value: string, public __meta__?: Record<string, any>) {
    super(value);
  }

  toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const GetNodesDocument = new TypedDocumentString(`
    subscription GetNodes {
  node(order_by: {order: asc}) {
    id
    name
    node_id
    type
    order
  }
}
    `) as unknown as TypedDocumentString<GetNodesSubscription, GetNodesSubscriptionVariables>;
export const UpdateNodeNameDocument = new TypedDocumentString(`
    mutation updateNodeName($id: bigint!, $name: String!) {
  update_node_by_pk(pk_columns: {id: $id}, _set: {name: $name}) {
    id
  }
}
    `) as unknown as TypedDocumentString<UpdateNodeNameMutation, UpdateNodeNameMutationVariables>;
export const DeleteNodeDocument = new TypedDocumentString(`
    mutation deleteNode($id: bigint!, $parent_id: bigint!, $order: Int!) {
  delete_node_by_pk(id: $id) {
    id
  }
  update_node(
    where: {order: {_gte: $order}, node_id: {_eq: $parent_id}}
    _inc: {order: -1}
  ) {
    affected_rows
  }
}
    `) as unknown as TypedDocumentString<DeleteNodeMutation, DeleteNodeMutationVariables>;
export const Insert_NodeDocument = new TypedDocumentString(`
    mutation insert_node($object: node_insert_input!, $parent_id: bigint!, $order: Int!) {
  update_node(
    where: {order: {_gte: $order}, node_id: {_eq: $parent_id}}
    _inc: {order: 1}
  ) {
    affected_rows
  }
  insert_node_one(object: $object) {
    id
  }
}
    `) as unknown as TypedDocumentString<Insert_NodeMutation, Insert_NodeMutationVariables>;