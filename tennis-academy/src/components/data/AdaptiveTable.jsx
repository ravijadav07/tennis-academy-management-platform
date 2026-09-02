import { useIsMobile } from '../../hooks/useMediaQuery';
import DataGrid from './DataGrid';
import CardListView from './CardListView';

export default function AdaptiveTable({ data, columns, renderCard, onRowClick, searchPlaceholder, emptyMessage, hideSearch }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <CardListView data={data} renderCard={renderCard} emptyMessage={emptyMessage} searchPlaceholder={hideSearch ? undefined : searchPlaceholder} />;
  }

  return <DataGrid data={data} columns={columns} onRowClick={onRowClick} searchPlaceholder={searchPlaceholder} hideSearch={hideSearch} />;
}