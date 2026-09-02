import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { Inbox } from 'lucide-react';
import { cn } from '../../utils/cn';

const INITIAL_COUNT = 10;
const LOAD_MORE_COUNT = 10;

function filterItem(item, query) {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  for (const key of Object.keys(item)) {
    const val = item[key];
    if (val != null && typeof val !== 'object' && String(val).toLowerCase().includes(q)) {
      return true;
    }
  }
  return false;
}

export default function CardListView({ data, renderCard, emptyMessage = 'No items found', searchPlaceholder = 'Search...', className = '' }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = data && data.length > 0 && searchQuery.trim()
    ? data.filter(item => filterItem(item, searchQuery))
    : data;

  if (!data || data.length === 0) {
    return (
      <Card className="py-12 text-center">
        <EmptyState icon={Inbox} title={emptyMessage} description="Try adjusting your search or filters." />
      </Card>
    );
  }

  const visibleData = filteredData ? filteredData.slice(0, visibleCount) : [];
  const hasMore = visibleCount < (filteredData ? filteredData.length : 0);

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + LOAD_MORE_COUNT, filteredData.length));
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.04, duration: 0.18, ease: 'easeOut' },
    }),
  };

  return (
    <div className={cn('space-y-3', className)}>
      {searchPlaceholder && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setVisibleCount(INITIAL_COUNT); }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 h-[38px] bg-white border border-line rounded-lg text-[13px] outline-none focus:ring-2 focus:ring-brand/10 focus:border-brand transition-all"
          />
        </div>
      )}

      {filteredData.length === 0 ? (
        <Card className="py-12 text-center">
          <EmptyState icon={Inbox} title="No results found" description="Try adjusting your search." />
        </Card>
      ) : (
        <AnimatePresence mode="popLayout">
          {visibleData.map((item, idx) => (
            <motion.div
              key={item.id || idx}
              custom={idx % LOAD_MORE_COUNT}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              layout
            >
              <Card className="flex flex-col gap-3">
                {renderCard(item, idx)}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {hasMore && (
        <div className="flex justify-center pt-1">
          <Button variant="secondary" size="md" onClick={handleLoadMore}>
            Load More ({filteredData.length - visibleCount} remaining)
          </Button>
        </div>
      )}

      {!hasMore && filteredData.length > INITIAL_COUNT && (
        <p className="text-center text-[12px] text-ink-faint py-2">No more results</p>
      )}
    </div>
  );
}