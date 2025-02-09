import { useCallback } from 'react';
import { useRecoilCallback, useSetRecoilState } from 'recoil';

import { FieldMetadata } from '@/object-record/field/types/FieldMetadata';
import { RecordBoardScopeInternalContext } from '@/object-record/record-board/scopes/scope-internal-context/RecordBoardScopeInternalContext';
import { onFieldsChangeScopedState } from '@/object-record/record-board/states/onFieldsChangeScopedState';
import { recordBoardCardFieldsScopedState } from '@/object-record/record-board/states/recordBoardCardFieldsScopedState';
import { savedRecordBoardCardFieldsScopedState } from '@/object-record/record-board/states/savedRecordBoardCardFieldsScopedState';
import { BoardFieldDefinition } from '@/object-record/record-board/types/BoardFieldDefinition';
import { ColumnDefinition } from '@/object-record/record-table/types/ColumnDefinition';
import { useAvailableScopeIdOrThrow } from '@/ui/utilities/recoil-scope/scopes-internal/hooks/useAvailableScopeId';

type useRecordBoardCardFieldsInternalProps = {
  recordBoardScopeId?: string;
};

export const useRecordBoardCardFieldsInternal = (
  props?: useRecordBoardCardFieldsInternalProps,
) => {
  const scopeId = useAvailableScopeIdOrThrow(
    RecordBoardScopeInternalContext,
    props?.recordBoardScopeId,
  );

  const setBoardCardFields = useSetRecoilState(
    recordBoardCardFieldsScopedState({ scopeId }),
  );

  const setSavedBoardCardFields = useSetRecoilState(
    savedRecordBoardCardFieldsScopedState({ scopeId }),
  );

  const handleFieldVisibilityChange = useRecoilCallback(
    ({ snapshot }) =>
      async (
        field: Omit<ColumnDefinition<FieldMetadata>, 'size' | 'position'>,
      ) => {
        const existingFields = await snapshot
          .getLoadable(recordBoardCardFieldsScopedState({ scopeId }))
          .getValue();

        const fieldIndex = existingFields.findIndex(
          ({ fieldMetadataId }) => field.fieldMetadataId === fieldMetadataId,
        );
        const fields = [...existingFields];

        if (fieldIndex === -1) {
          fields.push({ ...field, position: existingFields.length });
        } else {
          fields[fieldIndex] = {
            ...field,
            isVisible: !field.isVisible,
            position: existingFields.length,
          };
        }

        setSavedBoardCardFields(fields);
        setBoardCardFields(fields);

        const onFieldsChange = snapshot
          .getLoadable(onFieldsChangeScopedState({ scopeId }))
          .getValue();

        onFieldsChange?.(fields);
      },
    [scopeId, setBoardCardFields, setSavedBoardCardFields],
  );

  const handleFieldsChange = useRecoilCallback(
    ({ snapshot }) =>
      async (fields: BoardFieldDefinition<FieldMetadata>[]) => {
        setSavedBoardCardFields(fields);
        setBoardCardFields(fields);

        const onFieldsChange = snapshot
          .getLoadable(onFieldsChangeScopedState({ scopeId }))
          .getValue();

        await onFieldsChange?.(fields);
      },
    [scopeId, setBoardCardFields, setSavedBoardCardFields],
  );

  const handleFieldsReorder = useCallback(
    async (fields: BoardFieldDefinition<FieldMetadata>[]) => {
      const updatedFields = fields.map((column, index) => ({
        ...column,
        position: index,
      }));

      await handleFieldsChange(updatedFields);
    },
    [handleFieldsChange],
  );

  return { handleFieldVisibilityChange, handleFieldsReorder };
};
